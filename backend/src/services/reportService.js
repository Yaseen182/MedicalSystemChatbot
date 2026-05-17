const { query } = require('../config/database');

/**
 * Save a medical report for a completed session.
 */
const saveReport = async (sessionId, userId, { symptoms, diagnoses, recommendation, riskLevel }) => {
  const content = {
    symptoms,
    diagnoses,
    recommendation,
    riskLevel,
    generatedAt: new Date().toISOString(),
    disclaimer: 'This is not a medical diagnosis. Please consult a healthcare professional.',
  };

  const result = await query(
    'INSERT INTO medical_reports (session_id, user_id, content) VALUES ($1,$2,$3) RETURNING *',
    [sessionId, userId, JSON.stringify(content)]
  );
  return result.rows[0];
};

/**
 * Get all reports for a user.
 */
const getUserReports = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT mr.*, ms.risk_level, ms.started_at AS session_date
     FROM medical_reports mr
     JOIN medical_sessions ms ON ms.id = mr.session_id
     WHERE mr.user_id = $1
     ORDER BY mr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

/**
 * Get a single report (must belong to user).
 */
const getReport = async (reportId, userId) => {
  const result = await query(
    'SELECT * FROM medical_reports WHERE id=$1 AND user_id=$2',
    [reportId, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Report not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

module.exports = { saveReport, getUserReports, getReport };
