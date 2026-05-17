'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { ChromaClient } = require('chromadb');

const { embed } = require('../ai/claudeClient');
const config = require('../config');

// ── CLI flags ─────────────────────────────────────────────
const args = process.argv.slice(2);
const CLEAR = args.includes('--clear');
const DRY_RUN = args.includes('--dry-run');
const SKIP_DOWNLOAD = args.includes('--skip-download');

// ── Paths ─────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../data');
const CSV_PATH = path.join(DATA_DIR, 'Diseases_Symptoms.csv');

const CSV_URL =
  'https://huggingface.co/datasets/QuyenAnhDE/Diseases_Symptoms/resolve/main/Diseases_Symptoms.csv';

// ── Config ────────────────────────────────────────────────
const BATCH_SIZE = 10;

// ──────────────────────────────────────────────────────────
// STEP 1 — Download CSV (FIXED)
// ──────────────────────────────────────────────────────────
const downloadCSV = async () => {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('📥 Downloading dataset from HuggingFace...');

  const response = await axios.get(CSV_URL, {
    responseType: 'stream',
    maxRedirects: 5,
  });

  const writer = fs.createWriteStream(CSV_PATH);

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('✅ Download complete\n');
};

// ──────────────────────────────────────────────────────────
// STEP 2 — Parse CSV
// ──────────────────────────────────────────────────────────
const rowToChunk = (row, index) => {
  const name = (row['Name'] || '').trim();
  const symptoms = (row['Symptoms'] || '').trim();
  const treatments = (row['Treatments'] || '').trim();

  if (!name || !symptoms) return null;

  return {
    id: `hf_ds_${String(index).padStart(4, '0')}`,
    disease: name,
    text: `Disease: ${name}\n\nSymptoms: ${symptoms}\n\nTreatments: ${treatments || 'N/A'}`,
  };
};

const parseCSV = () => {
  console.log('📋 Parsing CSV...');

  const content = fs.readFileSync(CSV_PATH, 'utf-8');

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const docs = rows
    .map((row, i) => rowToChunk(row, i + 1))
    .filter(Boolean);

  console.log(`   Parsed: ${docs.length} documents\n`);

  return docs;
};

// ──────────────────────────────────────────────────────────
// STEP 3 — Seed Chroma
// ──────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seedChroma = async (docs) => {
  const client = new ChromaClient({
    path: config.chroma.url || 'http://localhost:8000',
  });

  try {
    await client.heartbeat();
    console.log('✅ ChromaDB connected');
  } catch (err) {
    console.error('❌ ChromaDB not running');
    process.exit(1);
  }

  if (CLEAR) {
    try {
      await client.deleteCollection({
        name: config.chroma.collection,
      });
      console.log('🗑️ Collection cleared');
    } catch {}
  }

  const collection = await client.getOrCreateCollection({
    name: config.chroma.collection,
  });

  console.log(`📦 Using collection: ${config.chroma.collection}`);

  // Check existing
  let existingIds = new Set();

  if (!CLEAR) {
    try {
      const existing = await collection.get();
      existingIds = new Set(existing.ids || []);
    } catch {}
  }

  const toInsert = docs.filter((d) => !existingIds.has(d.id));

  console.log(`⏳ Inserting ${toInsert.length} documents...\n`);

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const ids = batch.map((b) => b.id);
    const documents = batch.map((b) => b.text);

    // embeddings
    const embeddings = await Promise.all(
      documents.map((t) => embed(t))
    );

    const metadatas = batch.map((b) => ({
      disease: b.disease,
    }));

    await collection.add({
      ids,
      documents,
      embeddings,
      metadatas,
    });

    console.log(`✔ batch ${i / BATCH_SIZE + 1} inserted`);

    await sleep(50);
  }

  const total = await collection.count();

  console.log('\n🎉 DONE');
  console.log(`Total docs: ${total}`);
};

// ──────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────
(async () => {
  console.log('\n🏥 MedAI Seeder Starting...\n');

  if (!SKIP_DOWNLOAD || !fs.existsSync(CSV_PATH)) {
    await downloadCSV();
  } else {
    console.log('📁 Using cached CSV\n');
  }

  const docs = parseCSV();

  if (DRY_RUN) {
    console.log('DRY RUN:', docs.slice(0, 3));
    return;
  }

  await seedChroma(docs);
})().catch((err) => {
  console.error('❌ Failed:', err.message);
});