const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [usersRes, sessionsRes, flagsRes] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query("SELECT COUNT(*) FROM medical_sessions WHERE started_at > NOW() - INTERVAL '24 hours'"),
      query('SELECT COUNT(*) FROM emergency_flags WHERE resolved=false'),
    ]);

    res.json({
      totalUsers:      parseInt(usersRes.rows[0].count),
      sessionsToday:   parseInt(sessionsRes.rows[0].count),
      unresolvedFlags: parseInt(flagsRes.rows[0].count),
      ragDocuments:    4200, // placeholder — query ChromaDB for real count
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/conversations ──────────────────────────────
router.get('/conversations', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ms.id, ms.status, ms.risk_level, ms.started_at,
              u.name AS user_name, u.email,
              (SELECT COUNT(*) FROM symptoms s WHERE s.session_id=ms.id) AS symptom_count,
              (SELECT d.disease FROM diagnoses d WHERE d.session_id=ms.id ORDER BY d.rank LIMIT 1) AS top_outcome,
              EXISTS(SELECT 1 FROM emergency_flags ef WHERE ef.session_id=ms.id) AS flagged
       FROM medical_sessions ms
       JOIN users u ON u.id=ms.user_id
       ORDER BY ms.started_at DESC
       LIMIT 50`
    );
    res.json({ conversations: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/flags ──────────────────────────────────────
router.get('/flags', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ef.*, u.name AS user_name, u.email
       FROM emergency_flags ef
       JOIN users u ON u.id=ef.user_id
       ORDER BY ef.created_at DESC`
    );
    res.json({ flags: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/flags/:id/resolve ───────────────────────
router.patch('/flags/:id/resolve', async (req, res, next) => {
  try {
    await query('UPDATE emergency_flags SET resolved=true WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
