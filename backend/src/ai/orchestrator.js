/**
 * AI Orchestrator (thin client).
 *
 * The multi-agent medical pipeline now lives in the dedicated Python AI
 * service (see ../../../ai-service). This module simply forwards requests to
 * that service over HTTP, keeping the original `processMessage` interface so
 * the rest of the backend (routes/chat.js) is unchanged.
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

const client = axios.create({
  baseURL: config.aiService.url,
  timeout: config.aiService.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Process one user message through the Python multi-agent pipeline.
 *
 * @param {Array<{role,content}>} conversationHistory - Full session history
 * @param {string}                latestMessage       - The new user message
 * @returns {Promise<object>} Orchestrator result (same shape as before)
 */
const processMessage = async (conversationHistory, latestMessage) => {
  // Only role/content are needed by the pipeline — strip metadata/timestamps.
  const history = (conversationHistory || []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    logger.debug('Orchestrator: delegating to Python AI service');
    const { data } = await client.post('/process', {
      conversationHistory: history,
      latestMessage,
    });
    return data;
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    logger.error(`AI service request failed: ${detail}`);

    // Safe fallback so the chat endpoint degrades gracefully instead of 500ing.
    return {
      type: 'followup',
      message:
        "I'm having trouble analysing your symptoms right now. Could you describe them again — including how long you've had them and how severe they are? If this is an emergency, please call your local emergency services immediately.",
      extractedSymptoms: { symptoms: [] },
      diagnoses: [],
      recommendation: null,
      seekEmergencyCare: false,
      isComplete: false,
      safetyIssues: [],
    };
  }
};

module.exports = { processMessage };
