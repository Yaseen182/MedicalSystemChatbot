/**
 * RAG System Test
 * Usage: node src/rag/testRag.js
 */

'use strict';
require('dotenv').config();

const { retrieveMedicalContext } = require('./ragService');
const { embed }                  = require('../ai/claudeClient');

// ── Test queries ──────────────────────────────────────────────────────────────
const TEST_QUERIES = [
  'fever headache stiff neck',
  'chest pain shortness of breath sweating',
  'nausea vomiting diarrhea stomach cramps',
  'fatigue weight loss night sweats',
  'rash itching skin redness',
  'dizziness fainting low blood pressure',
];

// ── Cosine similarity helper ──────────────────────────────────────────────────
const cosineSim = (a, b) => {
  const dot  = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
};

// ── Test 1: Embedding sanity check ────────────────────────────────────────────
const testEmbeddings = async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1 — Embedding Quality Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pairs = [
    { a: 'fever high temperature chills',   b: 'elevated body temperature infection',  expect: 'HIGH' },
    { a: 'chest pain heart attack',          b: 'cardiac arrest myocardial infarction', expect: 'HIGH' },
    { a: 'headache migraine',                b: 'skin rash allergy',                    expect: 'LOW'  },
    { a: 'nausea vomiting stomach',          b: 'abdominal pain gastrointestinal',      expect: 'HIGH' },
  ];

  for (const { a, b, expect } of pairs) {
    const [vecA, vecB] = await Promise.all([embed(a), embed(b)]);
    const sim = cosineSim(vecA, vecB);
    const result = sim > 0.5 ? 'HIGH' : 'LOW';
    const ok = result === expect;

    console.log(`  ${ok ? '✅' : '❌'} [${result}] sim=${sim.toFixed(3)}`);
    console.log(`     A: "${a}"`);
    console.log(`     B: "${b}"`);
    console.log(`     Expected: ${expect}\n`);
  }
};

// ── Test 2: RAG Retrieval ─────────────────────────────────────────────────────
const testRetrieval = async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2 — RAG Retrieval');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const query of TEST_QUERIES) {
    console.log(`🔍 Query: "${query}"`);

    const start   = Date.now();
    const context = await retrieveMedicalContext(query, 3);
    const elapsed = Date.now() - start;

    const isFallback = context.includes('[Source: CDC]') ||
                       context.includes('[Source: WHO General Guidelines]');

    if (isFallback) {
      console.log(`  ⚠️  Using FALLBACK context (ChromaDB empty or unavailable)`);
    } else {
      // Show first 300 chars of each result
      const chunks = context.split('---').map(c => c.trim());
      console.log(`  ✅ Retrieved ${chunks.length} chunk(s) in ${elapsed}ms`);
      chunks.forEach((chunk, i) => {
        const preview = chunk.slice(0, 200).replace(/\n/g, ' ');
        console.log(`  [${i + 1}] ${preview}${chunk.length > 200 ? '...' : ''}`);
      });
    }
    console.log();
  }
};

// ── Test 3: Relevance check ───────────────────────────────────────────────────
const testRelevance = async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3 — Relevance Check (does result match query?)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const relevanceTests = [
    { query: 'chest pain sweating left arm', keywords: ['chest', 'cardiac', 'heart', 'pain'] },
    { query: 'frequent urination burning painful', keywords: ['urinary', 'urine', 'bladder', 'UTI'] },
    { query: 'joint pain morning stiffness swelling', keywords: ['joint', 'arthritis', 'stiffness'] },
  ];

  let passed = 0;

  for (const { query, keywords } of relevanceTests) {
    const context = await retrieveMedicalContext(query, 3);
    const contextLower = context.toLowerCase();
    const matched = keywords.filter(k => contextLower.includes(k.toLowerCase()));
    const ok = matched.length >= 1;

    if (ok) passed++;

    console.log(`  ${ok ? '✅' : '❌'} Query: "${query}"`);
    console.log(`     Keywords found: ${matched.length}/${keywords.length} → [${matched.join(', ')}]`);
    console.log(`     Missing: [${keywords.filter(k => !matched.includes(k)).join(', ')}]\n`);
  }

  console.log(`  Result: ${passed}/${relevanceTests.length} relevance tests passed\n`);
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n🧪  MedAI RAG System Test');
  console.log(`    Time: ${new Date().toISOString()}\n`);

  try {
    await testEmbeddings();
    await testRetrieval();
    await testRelevance();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  All tests complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('\n❌  Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();