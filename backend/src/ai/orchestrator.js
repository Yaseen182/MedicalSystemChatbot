/**
 * AI Orchestrator — coordinates all 6 agents in the MedAI pipeline:
 *
 *  Agent 1: Symptom Extractor
 *  Agent 2: Follow-up Question Generator
 *  Agent 3: Medical Knowledge Retriever (RAG)
 *  Agent 4: Disease Probability Ranker
 *  Agent 5: Safety Validator
 *  Agent 6: Final Response Generator
 */

const { chat } = require('./claudeClient');
const {
  SYMPTOM_EXTRACTOR,
  FOLLOW_UP_GENERATOR,
  DISEASE_RANKER,
  RESPONSE_GENERATOR,
  SAFETY_VALIDATOR,
} = require('./prompts');
const { retrieveMedicalContext } = require('../rag/ragService');
const logger = require('../utils/logger');

// ── Helpers ───────────────────────────────────────────────────

/**
 * Safely parse a JSON string returned by the model.
 * Strips markdown fences, then attempts JSON.parse.
 * Returns `fallback` on any failure or empty input.
 */
const safeParseJSON = (raw, fallback, agentName = 'unknown') => {
  if (!raw || raw.trim().length === 0) {
    logger.warn(`${agentName}: received empty response — using fallback`);
    return fallback;
  }
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (err) {
    logger.warn(`${agentName}: JSON parse failed — "${raw.slice(0, 120)}" — using fallback`, err.message);
    return fallback;
  }
};

/**
 * Call an agent and guard against empty responses.
 * Retries once if the first response is empty.
 */
const callAgent = async (messages, systemPrompt, maxTokens, agentName) => {
  let response = await chat(messages, systemPrompt, maxTokens);

  if (!response || response.trim().length === 0) {
    logger.warn(`${agentName}: empty response on first attempt — retrying once`);
    response = await chat(messages, systemPrompt, maxTokens);
  }

  if (!response || response.trim().length === 0) {
    logger.error(`${agentName}: empty response after retry`);
  }

  return response || '';
};

// ── Agent 1: Extract structured symptoms ─────────────────────
const extractSymptoms = async (conversationHistory) => {
  const userMessages = conversationHistory
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n');

  const raw = await callAgent(
    [{ role: 'user', content: `Extract symptoms from:\n${userMessages}` }],
    SYMPTOM_EXTRACTOR,
    512,
    'Agent1:SymptomExtractor'
  );

  return safeParseJSON(raw, {
    symptoms: [],
    duration: null,
    severity: null,
    age: null,
    additionalContext: null,
  }, 'Agent1:SymptomExtractor');
};

// ── Agent 2: Decide next follow-up or signal ready ───────────
const getNextAction = async (conversationHistory, extractedSymptoms) => {
  const context = `
Extracted so far: ${JSON.stringify(extractedSymptoms)}

Conversation:
${conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
  `.trim();

  const response = await callAgent(
    [{ role: 'user', content: context }],
    FOLLOW_UP_GENERATOR,
    256,
    'Agent2:FollowUpGenerator'
  );

  if (!response || response.trim().length === 0) {
    // Default: ask a safe follow-up if we can't get a response
    return {
      action: 'followup',
      question: 'Could you tell me more about your symptoms? How long have you been experiencing them and how severe would you rate them on a scale of 1 to 10?',
    };
  }

  const text = response.trim();

  if (text.includes('__EMERGENCY__')) return { action: 'emergency' };
  if (text.includes('__ANALYSIS_READY__')) return { action: 'analyze' };
  return { action: 'followup', question: text };
};

// ── Agent 3: Retrieve medical context (RAG) ──────────────────
const retrieveContext = async (symptoms) => {
  const query = symptoms.join(', ');
  return retrieveMedicalContext(query);
};

// ── Agent 4: Rank diseases by probability ────────────────────
const rankDiseases = async (extractedSymptoms, medicalContext) => {
  const prompt = `
Patient data:
${JSON.stringify(extractedSymptoms, null, 2)}

Medical knowledge:
${medicalContext}
  `.trim();

  const raw = await callAgent(
    [{ role: 'user', content: prompt }],
    DISEASE_RANKER,
    1024,
    'Agent4:DiseaseRanker'
  );

  return safeParseJSON(raw, {
    conditions: [],
    recommendation: 'Please consult a healthcare professional for a proper evaluation.',
    seekEmergencyCare: false,
  }, 'Agent4:DiseaseRanker');
};

// ── Agent 5: Safety validation ───────────────────────────────
const validateSafety = async (response) => {
  if (!response || response.trim().length === 0) {
    logger.warn('Agent5:SafetyValidator — skipped (empty input response)');
    return { safe: true, issues: [], correctedResponse: null };
  }

  const raw = await callAgent(
    [{ role: 'user', content: `Validate this medical AI response:\n\n${response}` }],
    SAFETY_VALIDATOR,
    512,
    'Agent5:SafetyValidator'
  );

  return safeParseJSON(raw, {
    safe: true,
    issues: [],
    correctedResponse: null,
  }, 'Agent5:SafetyValidator');
};

// ── Agent 6: Generate final user-facing response ─────────────
const generateFinalResponse = async (extractedSymptoms, rankResult, medicalContext) => {
  const prompt = `
Patient symptoms: ${JSON.stringify(extractedSymptoms)}

Possible conditions:
${JSON.stringify(rankResult.conditions, null, 2)}

Medical context:
${medicalContext}

Generate a compassionate, clear response for the patient.
  `.trim();

  const response = await callAgent(
    [{ role: 'user', content: prompt }],
    RESPONSE_GENERATOR,
    1024,
    'Agent6:ResponseGenerator'
  );

  // Last-resort fallback if the model still returns nothing
  if (!response || response.trim().length === 0) {
    logger.error('Agent6:ResponseGenerator — empty response even after retry, using fallback message');
    const topCondition = rankResult.conditions?.[0]?.disease;
    return [
      topCondition
        ? `Based on your symptoms, one possible consideration is ${topCondition}, among other conditions.`
        : 'Based on your symptoms, there are several possible conditions to consider.',
      'I strongly recommend consulting a qualified healthcare professional for an accurate diagnosis and appropriate treatment.',
      'This is not a medical diagnosis. Please consult a healthcare professional.',
    ].join('\n\n');
  }

  return response;
};

// ── Main orchestration entry point ───────────────────────────
/**
 * Process one user message through the full multi-agent pipeline.
 *
 * @param {Array<{role,content}>} conversationHistory - Full session history
 * @param {string}                latestMessage       - The new user message
 * @returns {Promise<OrchestratorResult>}
 */
const processMessage = async (conversationHistory, latestMessage) => {
  logger.info('Orchestrator: processing message');

  // Add latest message to history for context
  const history = [...conversationHistory, { role: 'user', content: latestMessage }];

  // Agent 1 — extract symptoms
  const extractedSymptoms = await extractSymptoms(history);
  logger.debug('Extracted symptoms:', extractedSymptoms);

  // Agent 2 — decide action
  const nextAction = await getNextAction(history, extractedSymptoms);
  logger.debug('Next action:', nextAction.action);

  // Emergency detected
  if (nextAction.action === 'emergency') {
    return {
      type: 'emergency',
      message:
        '⚠️ Based on your symptoms, you may need **immediate emergency care**. Please call emergency services (911) or go to your nearest emergency room now. Do not wait.\n\n*This is not a medical diagnosis. Please consult a healthcare professional.*',
      extractedSymptoms,
      diagnoses: [],
      isComplete: false,
    };
  }

  // More info needed — ask follow-up
  if (nextAction.action === 'followup') {
    return {
      type: 'followup',
      message: nextAction.question,
      extractedSymptoms,
      diagnoses: [],
      isComplete: false,
    };
  }

  // Agent 3 — retrieve RAG context
  const medicalContext = await retrieveContext(extractedSymptoms.symptoms || [latestMessage]);

  // Agent 4 — rank diseases
  const rankResult = await rankDiseases(extractedSymptoms, medicalContext);

  // Agent 6 — generate response
  let finalResponse = await generateFinalResponse(extractedSymptoms, rankResult, medicalContext);

  // Agent 5 — safety check
  const safety = await validateSafety(finalResponse);
  if (!safety.safe && safety.correctedResponse) {
    logger.warn('Safety issues found:', safety.issues);
    finalResponse = safety.correctedResponse;
  }

  return {
    type: 'analysis',
    message: finalResponse,
    extractedSymptoms,
    diagnoses: rankResult.conditions || [],
    recommendation: rankResult.recommendation,
    seekEmergencyCare: rankResult.seekEmergencyCare || false,
    isComplete: true,
    safetyIssues: safety.safe ? [] : safety.issues,
  };
};

module.exports = { processMessage, extractSymptoms, rankDiseases };