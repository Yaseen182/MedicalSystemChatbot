/**
 * DeepSeek AI Client + Medical-Grade Embedding Service
 *
 * Embeddings use @xenova/transformers with BGE-M3 model:
 * - 1024-dim vs 384-dim (MiniLM) — richer representation
 * - Better at medical terminology and clinical language
 * - Still runs fully locally, no API needed
 *
 * Install: npm install @xenova/transformers
 */

const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

// ── DeepSeek client ───────────────────────────────────────────────────────────
const deepseek = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: 'https://api.deepseek.com',
});

// ── Embedding pipeline (lazy-loaded, singleton) ───────────────────────────────
let _pipeline = null;

const getEmbeddingPipeline = async () => {
  if (_pipeline) return _pipeline;

  const { pipeline, env } = await import('@xenova/transformers');

  env.cacheDir = require('path').join(__dirname, '../../.cache/transformers');

  // BGE-M3: better than MiniLM for medical/technical text
  // Downloads ~570MB first time, cached after that
  logger.info('Loading embedding model (BGE-M3) — first run downloads ~570MB...');
  _pipeline = await pipeline('feature-extraction', 'Xenova/bge-m3');
  logger.info('Embedding model BGE-M3 ready ✓ (1024-dim)');

  return _pipeline;
};

// ── Extract content from DeepSeek response ────────────────────────────────────
const extractContent = (message) => {
  if (message.content && message.content.trim().length > 0) {
    return message.content.trim();
  }
  if (message.reasoning_content && message.reasoning_content.trim().length > 0) {
    logger.warn('DeepSeek: content empty — model hit token limit. Triggering retry.');
    return '';
  }
  logger.warn('DeepSeek: fully empty response', { message });
  return '';
};

// ── Chat ──────────────────────────────────────────────────────────────────────
const chat = async (messages, systemPrompt, maxTokens = 1024) => {
  const model = config.deepseek.model;
  logger.debug(`DeepSeek request — ${messages.length} messages, model: ${model}`);

  const isReasoningModel = model.includes('reasoner') || model.includes('flash');

  let formattedMessages;
  if (isReasoningModel) {
    const [firstMsg, ...rest] = messages;
    formattedMessages = [
      {
        role: 'user',
        content: `[Instructions]\n${systemPrompt}\n\n[User Message]\n${firstMsg?.content || ''}`,
      },
      ...rest,
    ];
  } else {
    formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
  }

  const effectiveMaxTokens = isReasoningModel ? Math.max(maxTokens, 2000) : maxTokens;

  const response = await deepseek.chat.completions.create({
    model,
    max_tokens: effectiveMaxTokens,
    temperature: isReasoningModel ? undefined : 0.3,
    messages: formattedMessages,
  });

  const finishReason = response.choices[0]?.finish_reason;
  logger.debug(`DeepSeek finish_reason: ${finishReason} | usage: ${JSON.stringify(response.usage)}`);

  if (finishReason === 'length') {
    logger.warn('DeepSeek: hit max_tokens limit — response may be truncated');
  }

  const message = response.choices[0]?.message;
  if (!message) {
    logger.error('DeepSeek: no message in response', { response });
    throw new Error('DeepSeek returned an empty response');
  }

  const content = extractContent(message);
  if (!content) {
    logger.warn('DeepSeek: extracted content is empty', { model, finishReason, usage: response.usage });
  }

  return content;
};

// ── Semantic Embedding (BGE-M3) ───────────────────────────────────────────────
/**
 * Generate a 1024-dim semantic embedding using BGE-M3.
 * BGE-M3 uses a special query prefix for better retrieval accuracy.
 *
 * @param {string}  text
 * @param {boolean} isQuery - true for search queries, false for documents
 * @returns {Promise<number[]>}
 */
const embed = async (text, isQuery = false) => {
  try {
    const pipe = await getEmbeddingPipeline();

    // BGE models use instruction prefix for queries (improves retrieval ~5-10%)
    const input = isQuery ? `Represent this medical query: ${text}` : text;

    const output = await pipe(input, {
      pooling:   'cls',   // BGE uses CLS token pooling (not mean)
      normalize: true,
    });

    return Array.from(output.data);

  } catch (err) {
    logger.error('Embedding error — falling back to pseudo-embedding:', err.message);
    return pseudoEmbed(text);
  }
};

/**
 * Fallback only — NOT suitable for production RAG.
 * Dims match BGE-M3 (1024) to keep ChromaDB collection consistent.
 */
const pseudoEmbed = (text) => {
  const dims = 1024;
  const vec = new Array(dims).fill(0);
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    vec[i % dims] = (vec[i % dims] + code * 0.001) % 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
};

module.exports = { chat, embed, deepseek };