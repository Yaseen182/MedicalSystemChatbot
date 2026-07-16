const express = require('express');
const { authenticate } = require('../middleware/auth');
const sessionService = require('../services/sessionService');
const reportService = require('../services/reportService');
const { query } = require('../config/database');

const router = express.Router();
router.use(authenticate);

// ── GET /api/dashboard/stats ──────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [sessionsRes, symptomsRes, highRiskRes, reportsRes] = await Promise.all([
      // Count only non-empty sessions (those with at least one message).
      query(
        `SELECT COUNT(*) FROM medical_sessions ms
         WHERE ms.user_id=$1
           AND (ms.status = 'complete' OR EXISTS (SELECT 1 FROM symptoms s WHERE s.session_id = ms.id))`,
        [userId]
      ),
      query('SELECT COUNT(*) FROM symptoms s JOIN medical_sessions ms ON ms.id=s.session_id WHERE ms.user_id=$1', [userId]),
      query("SELECT COUNT(*) FROM medical_sessions WHERE user_id=$1 AND risk_level='high'", [userId]),
      query('SELECT COUNT(*) FROM medical_reports WHERE user_id=$1', [userId]),
    ]);

    res.json({
      totalSessions:   parseInt(sessionsRes.rows[0].count),
      symptomsLogged:  parseInt(symptomsRes.rows[0].count),
      highRiskEvents:  parseInt(highRiskRes.rows[0].count),
      reportsSaved:    parseInt(reportsRes.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/sessions ───────────────────────────────
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/reports ────────────────────────────────
router.get('/reports', async (req, res, next) => {
  try {
    const reports = await reportService.getUserReports(req.user.id);
    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/reports/:id ───────────────────────────
router.get('/reports/:id', async (req, res, next) => {
  try {
    const report = await reportService.getReport(req.params.id, req.user.id);
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/risk-history ──────────────────────────
router.get('/risk-history', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
         TO_CHAR(started_at, 'Mon') AS month,
         EXTRACT(MONTH FROM started_at) AS month_num,
         AVG(CASE risk_level WHEN 'high' THEN 90 WHEN 'medium' THEN 50 ELSE 20 END) AS avg_risk
       FROM medical_sessions
       WHERE user_id=$1 AND started_at > NOW() - INTERVAL '12 months'
       GROUP BY month, month_num
       ORDER BY month_num`,
      [req.user.id]
    );
    res.json({ riskHistory: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
