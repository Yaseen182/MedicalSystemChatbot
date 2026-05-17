const { ChromaClient } = require('chromadb');
const { embed } = require('../ai/claudeClient');
const config = require('../config');
const logger = require('../utils/logger');

let chromaClient = null;
let collection = null;

/**
 * Lazily initialise ChromaDB client & collection.
 */
const getCollection = async () => {
  if (collection) return collection;

  try {
    chromaClient = new ChromaClient({ path: config.chroma.url });
    collection = await chromaClient.getOrCreateCollection({
      name: config.chroma.collection,
      metadata: { description: 'MedAI medical knowledge base' },
    });
    logger.info(`ChromaDB collection "${config.chroma.collection}" ready`);
  } catch (err) {
    logger.warn('ChromaDB unavailable — RAG disabled:', err.message);
    collection = null;
  }

  return collection;
};

/**
 * Retrieve the top-k most relevant medical knowledge chunks for a query.
 *
 * @param {string}   query
 * @param {number}   topK   Default 5
 * @returns {Promise<string>}  Concatenated context paragraphs
 */
const retrieveMedicalContext = async (query, topK = 5) => {
  const col = await getCollection();

  if (!col) {
    // Fallback: return curated static context snippets
    return getFallbackContext(query);
  }

  try {
    const queryEmbedding = await embed(query);
    const results = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ['documents', 'metadatas'],
    });

    const docs = results.documents?.[0] || [];
    if (docs.length === 0) return getFallbackContext(query);

    return docs
      .map((doc, i) => {
        const meta = results.metadatas?.[0]?.[i];
        const src = meta?.source ? `[Source: ${meta.source}]` : '';
        return `${src}\n${doc}`;
      })
      .join('\n\n---\n\n');
  } catch (err) {
    logger.warn('RAG retrieval error:', err.message);
    return getFallbackContext(query);
  }
};

/**
 * Add medical documents to the vector store.
 *
 * @param {Array<{id:string, text:string, source:string, category:string}>} docs
 */
const addDocuments = async (docs) => {
  const col = await getCollection();
  if (!col) throw new Error('ChromaDB not available');

  const ids = docs.map((d) => d.id);
  const texts = docs.map((d) => d.text);
  const metadatas = docs.map((d) => ({ source: d.source, category: d.category }));
  const embeddings = await Promise.all(texts.map(embed));

  await col.add({ ids, embeddings, documents: texts, metadatas });
  logger.info(`Added ${docs.length} documents to ChromaDB`);
};

/**
 * Static fallback context when ChromaDB is unavailable.
 * Covers common symptoms with clinically accurate general guidance.
 */
const getFallbackContext = (query) => {
  const q = query.toLowerCase();
  const contexts = [];

  if (q.includes('fever') || q.includes('temperature')) {
    contexts.push(`[Source: CDC]\nFever (temperature > 38°C / 100.4°F) is a common immune response to infection.
Most fevers in adults resolve within 3–5 days. Seek care if fever exceeds 39.4°C (103°F),
lasts more than 3 days, or is accompanied by severe headache, stiff neck, or rash.`);
  }

  if (q.includes('headache')) {
    contexts.push(`[Source: Mayo Clinic]\nHeadaches are categorised as tension, migraine, or secondary.
Red flags requiring urgent evaluation: sudden severe onset ("thunderclap"), fever + stiff neck,
vision changes, neurological symptoms, or headache after head injury.`);
  }

  if (q.includes('cough')) {
    contexts.push(`[Source: WHO]\nAcute cough (<3 weeks) is most commonly caused by viral upper respiratory
infection. Productive cough with fever may indicate pneumonia. Chronic cough (>8 weeks)
warrants evaluation for asthma, GERD, or post-nasal drip.`);
  }

  if (q.includes('chest pain')) {
    contexts.push(`[Source: American Heart Association]\nChest pain is a medical emergency until proven otherwise.
Cardiac chest pain is typically crushing, radiating to the left arm or jaw, accompanied by
sweating and shortness of breath. Call emergency services immediately.`);
  }

  if (q.includes('nausea') || q.includes('vomiting')) {
    contexts.push(`[Source: MedlinePlus]\nNausea and vomiting have many causes including viral gastroenteritis,
food poisoning, medications, and pregnancy. Seek care if vomiting is persistent,
contains blood, or is accompanied by severe abdominal pain or signs of dehydration.`);
  }

  if (q.includes('fatigue') || q.includes('tired')) {
    contexts.push(`[Source: CDC]\nFatigue is a symptom of many conditions. Sudden onset fatigue with fever
and muscle aches may indicate influenza or other viral illness. Chronic fatigue lasting
>6 months requires medical evaluation.`);
  }

  return contexts.length > 0
    ? contexts.join('\n\n---\n\n')
    : `[Source: WHO General Guidelines]\nSymptoms should be evaluated by a qualified healthcare professional.
Any combination of fever, difficulty breathing, chest pain, or altered consciousness
warrants immediate medical attention.`;
};

module.exports = { retrieveMedicalContext, addDocuments, getCollection };
