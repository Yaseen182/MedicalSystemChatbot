const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { processMessage } = require('../ai/orchestrator');
const sessionService = require('../services/sessionService');
const reportService = require('../services/reportService');
const logger = require('../utils/logger');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// ── POST /api/chat/session ─ create a new session ─────────────
router.post('/session', async (req, res, next) => {
  try {
    const session = await sessionService.createSession(req.user.id);
    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/chat/message ─ send a message ───────────────────
router.post(
  '/message',
  aiLimiter,
  [
    body('sessionId').isUUID().withMessage('Valid session ID required'),
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1–2000 chars'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { sessionId, message } = req.body;

    try {
      // Validate session belongs to user
      await sessionService.getSession(sessionId, req.user.id);

      // Retrieve conversation history
      const history = await sessionService.getHistory(sessionId);

      // Run multi-agent pipeline
      const result = await processMessage(history, message);

      // Persist user message
      await sessionService.appendMessage(sessionId, 'user', message);

      // Persist assistant response
      await sessionService.appendMessage(sessionId, 'assistant', result.message, {
        type: result.type,
        diagnoses: result.diagnoses,
      });

      // Handle emergency
      if (result.type === 'emergency') {
        await sessionService.flagEmergency(sessionId, req.user.id, message);
      }

      // If analysis complete — persist structured data
      if (result.isComplete) {
        await sessionService.saveSymptoms(sessionId, result.extractedSymptoms?.symptoms || []);
        await sessionService.saveDiagnoses(sessionId, result.diagnoses || []);

        const riskLevel = result.seekEmergencyCare ? 'high'
          : (result.diagnoses?.[0]?.probability >= 60 ? 'medium' : 'low');

        await sessionService.completeSession(sessionId, riskLevel, result.recommendation);

        // Auto-save report
        try {
          await reportService.saveReport(sessionId, req.user.id, {
            symptoms: result.extractedSymptoms?.symptoms || [],
            diagnoses: result.diagnoses || [],
            recommendation: result.recommendation || '',
            riskLevel,
          });
        } catch (e) {
          logger.warn('Report save failed (non-fatal):', e.message);
        }
      }

      res.json({
        message: result.message,
        type: result.type,
        diagnoses: result.diagnoses || [],
        extractedSymptoms: result.extractedSymptoms || {},
        recommendation: result.recommendation || null,
        seekEmergencyCare: result.seekEmergencyCare || false,
        isComplete: result.isComplete,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/chat/history/:sessionId ──────────────────────────
router.get('/history/:sessionId', async (req, res, next) => {
  try {
    await sessionService.getSession(req.params.sessionId, req.user.id);
    const history = await sessionService.getHistory(req.params.sessionId);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
