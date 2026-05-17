/**
 * DeepSeek AI Client
 * DeepSeek's API is OpenAI-compatible — we use the openai SDK pointed at DeepSeek's base URL.
 */

const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

const deepseek = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Extract text content from a DeepSeek response message.
 *
 * IMPORTANT — two separate fields:
 *   message.reasoning_content  = internal chain-of-thought (NEVER show to users)
 *   message.content            = the actual final answer  (always use this)
 *
 * When content is empty but reasoning_content exists it means the model ran out
 * of token budget mid-thought. We return '' to trigger a retry with more tokens.
 *
 * @param {object} message - response.choices[0].message
 * @returns {string}
 */
const extractContent = (message) => {
  if (message.content && message.content.trim().length > 0) {
    return message.content.trim();
  }

  if (message.reasoning_content && message.reasoning_content.trim().length > 0) {
    logger.warn(
      'DeepSeek: content is empty but reasoning_content exists — ' +
      'model likely hit token limit mid-thought. Returning empty to trigger retry.'
    );
    return '';
  }

  logger.warn('DeepSeek: fully empty response received', { message });
  return '';
};

/**
 * Send a chat conversation to DeepSeek and get a text response.
 *
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {string} systemPrompt
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
const chat = async (messages, systemPrompt, maxTokens = 1024) => {
  const model = config.deepseek.model;
  logger.debug(`DeepSeek request — ${messages.length} messages, model: ${model}`);

  // deepseek-reasoner does NOT support the 'system' role.
  // Merge the system prompt into the first user message instead.
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

  // Reasoning models consume tokens for internal thinking BEFORE writing the answer.
  // Boost the budget so the model always has room to write the actual reply.
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
    logger.warn('DeepSeek: hit max_tokens limit — response may be truncated or empty');
  }

  const message = response.choices[0]?.message;
  if (!message) {
    logger.error('DeepSeek: no message in response', { response });
    throw new Error('DeepSeek returned an empty response');
  }

  const content = extractContent(message);

  if (!content) {
    logger.warn('DeepSeek: extracted content is empty', {
      model,
      finishReason,
      usage: response.usage,
    });
  }

  return content;
};

/**
 * Pseudo-embedding (512-dim) — DeepSeek doesn't expose an embeddings endpoint yet.
 * Replace with a real embeddings service in production.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
const embed = async (text) => {
  const dims = 512;
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