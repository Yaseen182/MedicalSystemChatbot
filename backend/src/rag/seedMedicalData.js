/**
 * MedAI — Medical Knowledge Base Seeder (BGE-M3 edition)
 *
 * Usage (from backend/ folder):
 *   node src/rag/seedMedicalData.js                 # download + seed
 *   node src/rag/seedMedicalData.js --clear         # wipe + re-seed
 *   node src/rag/seedMedicalData.js --skip-download # use cached CSV
 *   node src/rag/seedMedicalData.js --dry-run       # preview only
 *
 * NOTE: BGE-M3 uses isQuery=false for documents (no instruction prefix)
 */

'use strict';
require('dotenv').config();

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { parse }        = require('csv-parse/sync');
const { ChromaClient } = require('chromadb');
const { embed }        = require('../ai/claudeClient');
const config           = require('../config');

const args          = process.argv.slice(2);
const CLEAR         = args.includes('--clear');
const DRY_RUN       = args.includes('--dry-run');
const SKIP_DOWNLOAD = args.includes('--skip-download');

const DATA_DIR = path.join(__dirname, '../../data');
const CSV_PATH = path.join(DATA_DIR, 'Diseases_Symptoms.csv');
const CSV_URL  =
  'https://huggingface.co/datasets/QuyenAnhDE/Diseases_Symptoms/resolve/main/Diseases_Symptoms.csv';

const BATCH_SIZE = 5;

// ── Download ──────────────────────────────────────────────────────────────────
const downloadCSV = async () => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📥  Downloading dataset from HuggingFace...\n');

  const response = await axios.get(CSV_URL, { responseType: 'stream', maxRedirects: 5, timeout: 30000 });
  const writer   = fs.createWriteStream(CSV_PATH);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  console.log('✅  Download complete\n');
};

// ── Parse ─────────────────────────────────────────────────────────────────────
const rowToChunk = (row, index) => {
  const name       = (row['Name']       || '').trim();
  const symptoms   = (row['Symptoms']   || '').trim();
  const treatments = (row['Treatments'] || '').trim();
  if (!name || !symptoms) return null;

  const text = [
    `Disease: ${name}`,
    `Symptoms: ${symptoms}`,
    treatments && treatments.toLowerCase() !== 'null' ? `Treatments: ${treatments}` : '',
  ].filter(Boolean).join('\n');

  return { id: `hf_ds_${String(index).padStart(4, '0')}`, disease: name, text };
};

const parseCSV = () => {
  console.log('📋  Parsing CSV...');
  const rows = parse(fs.readFileSync(CSV_PATH, 'utf-8'), {
    columns: true, skip_empty_lines: true, trim: true, relax_column_count: true,
  });
  const docs = rows.map((r, i) => rowToChunk(r, i + 1)).filter(Boolean);
  console.log(`    ${rows.length} rows → ${docs.length} valid documents\n`);
  return docs;
};

// ── Seed ──────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seedChroma = async (docs) => {
  const client = new ChromaClient({ path: config.chroma.url || 'http://localhost:8000' });

  try { await client.heartbeat(); console.log('✅  ChromaDB connected'); }
  catch { console.error('❌  ChromaDB not running'); process.exit(1); }

  if (CLEAR) {
    try { await client.deleteCollection({ name: config.chroma.collection }); console.log('🗑️   Collection cleared'); }
    catch { /* didn't exist */ }
  }

  const collection = await client.getOrCreateCollection({
    name: config.chroma.collection,
    metadata: { description: 'MedAI — BGE-M3 embeddings, 400 diseases' },
  });

  let existingIds = new Set();
  if (!CLEAR) {
    try {
      const existing = await collection.get({ include: [] });
      existingIds = new Set(existing.ids || []);
      if (existingIds.size > 0) console.log(`ℹ️   ${existingIds.size} docs exist — skipping duplicates`);
    } catch { /* empty */ }
  }

  const toInsert = docs.filter((d) => !existingIds.has(d.id));
  if (toInsert.length === 0) { console.log('\n✅  Already seeded. Use --clear to re-seed.'); return; }

  console.log(`\n⏳  Embedding + inserting ${toInsert.length} docs (BGE-M3, first run ~570MB download)...\n`);

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch      = toInsert.slice(i, i + BATCH_SIZE);
    const ids        = batch.map((d) => d.id);
    const documents  = batch.map((d) => d.text);
    const metadatas  = batch.map((d) => ({ disease: d.disease, source: 'HuggingFace/QuyenAnhDE' }));

    // isQuery=false for documents — no instruction prefix
    const embeddings = await Promise.all(documents.map((t) => embed(t, false)));

    await collection.add({ ids, documents, embeddings, metadatas });
    inserted += batch.length;
    const pct = String(Math.round((inserted / toInsert.length) * 100)).padStart(3);
    console.log(`  [${pct}%] ✓ ${batch.map((d) => d.disease).join(' | ')}`);
    await sleep(30);
  }

  const total = await collection.count();
  console.log(`\n🎉  Done! ${inserted} inserted, ${total} total in "${config.chroma.collection}"\n`);
};

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n🏥  MedAI Seeder — BGE-M3 Edition');
  console.log('   Embedding : BGE-M3 (1024-dim, medical-optimized)');
  console.log(`   Target    : ${config.chroma.url} → "${config.chroma.collection}"\n`);

  if (!SKIP_DOWNLOAD || !fs.existsSync(CSV_PATH)) await downloadCSV();
  else console.log('⏭️   Using cached CSV\n');

  const docs = parseCSV();

  if (DRY_RUN) {
    docs.slice(0, 5).forEach((d, i) => console.log(`[${i+1}] ${d.id} — ${d.disease}\n${d.text.slice(0,150)}\n`));
    console.log(`✅  ${docs.length} docs ready. Nothing written.`);
    return;
  }

  await seedChroma(docs);
})().catch((err) => { console.error('❌  Failed:', err.message); process.exit(1); });