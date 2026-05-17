/**
 * RAG Service — Hybrid Search (Semantic + BM25 Keyword)
 *
 * Combines two retrieval strategies:
 *   1. Semantic Search  — BGE-M3 embeddings via ChromaDB
 *   2. BM25 Keyword     — TF-IDF style exact/partial keyword matching
 *
 * Results are fused using Reciprocal Rank Fusion (RRF) — a proven
 * technique that consistently outperforms either method alone.
 *
 * Why Hybrid?
 *   - Semantic alone misses exact symptom names ("myocardial infarction")
 *   - Keyword alone misses synonyms ("heart attack" ≠ "MI")
 *   - Hybrid catches both
 */

const { ChromaClient } = require('chromadb');
const { embed }        = require('../ai/claudeClient');
const config           = require('../config');
const logger           = require('../utils/logger');

let chromaClient = null;
let collection   = null;

// ── In-memory BM25 index (built once from ChromaDB docs) ─────────────────────
let bm25Index = null; // { docs: [{id, text, disease}], idf: Map, avgLen }

// ─────────────────────────────────────────────────────────────────────────────
// ChromaDB connection
// ─────────────────────────────────────────────────────────────────────────────
const getCollection = async () => {
  if (collection) return collection;

  try {
    chromaClient = new ChromaClient({ path: config.chroma.url });
    collection   = await chromaClient.getOrCreateCollection({
      name:     config.chroma.collection,
      metadata: { description: 'MedAI medical knowledge base' },
    });

    const count = await collection.count();
    logger.info(`ChromaDB ready — "${config.chroma.collection}" (${count} docs)`);

    if (count === 0) {
      logger.warn('ChromaDB collection is EMPTY — run: node src/rag/seedMedicalData.js');
    }
  } catch (err) {
    logger.warn('ChromaDB unavailable — using fallback:', err.message);
    collection = null;
  }

  return collection;
};

// ─────────────────────────────────────────────────────────────────────────────
// BM25 Implementation
// ─────────────────────────────────────────────────────────────────────────────
const K1 = 1.5; // term frequency saturation
const B  = 0.75; // length normalization

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2); // skip very short tokens

/**
 * Build BM25 index from all documents in ChromaDB.
 * Called once and cached in memory.
 */
const buildBM25Index = async (col) => {
  if (bm25Index) return bm25Index;

  logger.info('Building BM25 index from ChromaDB documents...');

  const result = await col.get({ include: ['documents', 'metadatas'] });
  const ids      = result.ids       || [];
  const texts    = result.documents || [];
  const metas    = result.metadatas || [];

  if (ids.length === 0) return null;

  // Tokenize all docs
  const tokenized = texts.map(tokenize);
  const avgLen    = tokenized.reduce((s, t) => s + t.length, 0) / tokenized.length;

  // Compute IDF for each term
  const df  = new Map();
  const N   = tokenized.length;

  for (const tokens of tokenized) {
    const unique = new Set(tokens);
    for (const term of unique) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const idf = new Map();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
  }

  bm25Index = {
    docs: ids.map((id, i) => ({
      id,
      text:    texts[i],
      disease: metas[i]?.disease || '',
      tokens:  tokenized[i],
    })),
    idf,
    avgLen,
  };

  logger.info(`BM25 index built — ${ids.length} documents, ${idf.size} unique terms`);
  return bm25Index;
};

/**
 * BM25 score for a single document given query terms.
 */
const bm25Score = (docTokens, queryTerms, idf, avgLen) => {
  const docLen = docTokens.length;
  const tf     = new Map();

  for (const token of docTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  let score = 0;
  for (const term of queryTerms) {
    const termIdf = idf.get(term) || 0;
    const termTf  = tf.get(term)  || 0;
    const num     = termTf * (K1 + 1);
    const den     = termTf + K1 * (1 - B + B * (docLen / avgLen));
    score += termIdf * (num / den);
  }
  return score;
};

/**
 * Run BM25 keyword search, return top-k results with ranks.
 */
const bm25Search = (query, topK) => {
  if (!bm25Index) return [];

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored = bm25Index.docs.map((doc) => ({
    id:      doc.id,
    text:    doc.text,
    disease: doc.disease,
    score:   bm25Score(doc.tokens, queryTerms, bm25Index.idf, bm25Index.avgLen),
  }));

  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

// ─────────────────────────────────────────────────────────────────────────────
// Reciprocal Rank Fusion (RRF)
// ─────────────────────────────────────────────────────────────────────────────
const RRF_K = 60; // standard constant, higher = less aggressive fusion

/**
 * Fuse semantic and keyword results using RRF.
 * Each result gets score = Σ 1/(k + rank) across all result lists.
 */
const reciprocalRankFusion = (semanticResults, keywordResults, topK) => {
  const scores = new Map(); // id → { rrfScore, text, disease }

  const addResults = (results, listWeight = 1) => {
    results.forEach(({ id, text, disease }, rank) => {
      const rrfScore = listWeight / (RRF_K + rank + 1);
      if (scores.has(id)) {
        scores.get(id).rrfScore += rrfScore;
      } else {
        scores.set(id, { rrfScore, text, disease });
      }
    });
  };

  // Semantic results weighted slightly higher (better for medical synonyms)
  addResults(semanticResults, 1.2);
  addResults(keywordResults,  1.0);

  return [...scores.entries()]
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);
};

// ─────────────────────────────────────────────────────────────────────────────
// Main retrieval function
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Hybrid retrieval: semantic + BM25 + RRF fusion.
 *
 * @param {string} query
 * @param {number} topK
 * @returns {Promise<string>}
 */
const retrieveMedicalContext = async (query, topK = 5) => {
  if (!query || query.trim().length === 0) return getFallbackContext('');

  const col = await getCollection();
  if (!col) return getFallbackContext(query);

  try {
    const count = await col.count();
    if (count === 0) return getFallbackContext(query);

    // Build BM25 index if not yet built
    await buildBM25Index(col);

    // ── 1. Semantic search (BGE-M3 with query prefix) ──────────────────────
    const queryEmbedding = await embed(query, true); // isQuery=true → adds instruction prefix

    const semanticRaw = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults:        Math.min(topK * 2, count),
      include:         ['documents', 'metadatas', 'distances'],
    });

    const semanticResults = (semanticRaw.documents?.[0] || []).map((text, i) => ({
      id:       semanticRaw.ids?.[0]?.[i]            || `sem_${i}`,
      text,
      disease:  semanticRaw.metadatas?.[0]?.[i]?.disease || '',
      distance: semanticRaw.distances?.[0]?.[i]      || 1,
    })).filter((r) => r.distance < 1.5); // filter irrelevant

    // ── 2. BM25 keyword search ──────────────────────────────────────────────
    const keywordResults = bm25Search(query, topK * 2);

    logger.debug(
      `Hybrid RAG — semantic: ${semanticResults.length}, keyword: ${keywordResults.length} results`
    );

    // ── 3. Fuse with RRF ────────────────────────────────────────────────────
    const fused = reciprocalRankFusion(semanticResults, keywordResults, topK);

    if (fused.length === 0) {
      logger.warn('Hybrid RAG: no results after fusion — using fallback');
      return getFallbackContext(query);
    }

    logger.debug(`RAG: returning ${fused.length} fused results for "${query.slice(0, 60)}"`);

    return fused
      .map(({ text, disease }) => {
        const header = disease ? `[Disease: ${disease}]` : '';
        return `${header}\n${text}`.trim();
      })
      .join('\n\n---\n\n');

  } catch (err) {
    logger.warn('RAG retrieval error:', err.message);
    return getFallbackContext(query);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Add documents
// ─────────────────────────────────────────────────────────────────────────────
const addDocuments = async (docs) => {
  const col = await getCollection();
  if (!col) throw new Error('ChromaDB not available');

  const ids        = docs.map((d) => d.id);
  const texts      = docs.map((d) => d.text);
  const metadatas  = docs.map((d) => ({ source: d.source, category: d.category, disease: d.disease || '' }));
  const embeddings = await Promise.all(texts.map((t) => embed(t, false))); // isQuery=false for docs

  await col.add({ ids, embeddings, documents: texts, metadatas });
  bm25Index = null; // invalidate BM25 index so it rebuilds on next query
  logger.info(`Added ${docs.length} documents to ChromaDB`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Static fallback
// ─────────────────────────────────────────────────────────────────────────────
const getFallbackContext = (query) => {
  const q = (query || '').toLowerCase();
  const contexts = [];

  if (q.includes('fever') || q.includes('temperature'))
    contexts.push(`[Source: CDC]\nFever (>38°C) is a common immune response. Seek care if >39.4°C, lasts >3 days, or comes with stiff neck/rash.`);

  if (q.includes('headache'))
    contexts.push(`[Source: Mayo Clinic]\nRed flags: thunderclap onset, fever + stiff neck, post-trauma, vision changes.`);

  if (q.includes('chest pain'))
    contexts.push(`[Source: AHA]\nChest pain is a medical emergency until proven otherwise. Cardiac pain: crushing, radiates to arm/jaw. Call emergency services.`);

  if (q.includes('cough'))
    contexts.push(`[Source: WHO]\nAcute cough (<3 weeks): usually viral. Productive cough + fever may indicate pneumonia.`);

  if (q.includes('nausea') || q.includes('vomiting'))
    contexts.push(`[Source: MedlinePlus]\nSeek care if vomiting is persistent, contains blood, or with severe abdominal pain.`);

  if (q.includes('fatigue') || q.includes('tired'))
    contexts.push(`[Source: CDC]\nFatigue with fever and myalgia may indicate viral illness. Chronic fatigue >6 months requires evaluation.`);

  if (q.includes('shortness of breath') || q.includes('breathing'))
    contexts.push(`[Source: ATS]\nAcute dyspnea: PE, pneumothorax, heart failure are emergencies. Wheeze → asthma; fever/cough → pneumonia.`);

  if (q.includes('rash'))
    contexts.push(`[Source: AAD]\nNon-blanching petechial rash with fever = possible meningococcemia — EMERGENCY.`);

  return contexts.length > 0
    ? contexts.join('\n\n---\n\n')
    : `[Source: WHO]\nSymptoms should be evaluated by a qualified healthcare professional. Fever, difficulty breathing, chest pain, or altered consciousness warrants immediate attention.`;
};

module.exports = { retrieveMedicalContext, addDocuments, getCollection };