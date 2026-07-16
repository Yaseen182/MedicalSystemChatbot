const { query } = require('../config/database');
const { get, set, del } = require('../config/redis');

const SESSION_TTL = 60 * 60 * 6; // 6 hours in Redis

// ── Conversation history (Redis) ─────────────────────────────

const getHistory = async (sessionId) => {
  // Redis is the fast path / cache.
  const cached = await get(`session:${sessionId}:history`);
  if (cached && cached.length > 0) return cached;

  // Fallback to PostgreSQL (source of truth) so context survives even when
  // Redis is unavailable. Rehydrate the cache for subsequent reads.
  const result = await query(
    'SELECT role, content, metadata, created_at FROM conversation_messages WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );

  const history = result.rows.map((row) => ({
    role: row.role,
    content: row.content,
    metadata: row.metadata || {},
    timestamp: row.created_at,
  }));

  if (history.length > 0) {
    await set(`session:${sessionId}:history`, history, SESSION_TTL);
  }

  return history;
};

const appendMessage = async (sessionId, role, content, metadata = {}) => {
  const history = await getHistory(sessionId);
  history.push({ role, content, metadata, timestamp: new Date().toISOString() });
  await set(`session:${sessionId}:history`, history, SESSION_TTL);

  // Persist to PostgreSQL
  await query(
    'INSERT INTO conversation_messages (session_id, role, content, metadata) VALUES ($1,$2,$3,$4)',
    [sessionId, role, content, JSON.stringify(metadata)]
  );

  return history;
};

// ── Session CRUD ──────────────────────────────────────────────

const createSession = async (userId) => {
  const result = await query(
    'INSERT INTO medical_sessions (user_id, status) VALUES ($1, $2) RETURNING *',
    [userId, 'active']
  );
  return result.rows[0];
};

const getSession = async (sessionId, userId) => {
  const result = await query(
    'SELECT * FROM medical_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

const completeSession = async (sessionId, riskLevel = 'low', summary = '') => {
  await query(
    'UPDATE medical_sessions SET status=$1, risk_level=$2, summary=$3, ended_at=NOW() WHERE id=$4',
    ['complete', riskLevel, summary, sessionId]
  );
  await del(`session:${sessionId}:history`);
};

const getUserSessions = async (userId, limit = 20, offset = 0) => {
  // Only return sessions that actually have content (at least one message).
  // This excludes empty sessions that were created but never used.
  const result = await query(
    `SELECT ms.*, 
       COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), '[]') AS symptoms,
       COALESCE(json_agg(json_build_object('disease', d.disease, 'probability', d.probability)) 
         FILTER (WHERE d.id IS NOT NULL), '[]') AS diagnoses
     FROM medical_sessions ms
     LEFT JOIN symptoms s ON s.session_id = ms.id
     LEFT JOIN diagnoses d ON d.session_id = ms.id
     WHERE ms.user_id = $1
       AND (
         ms.status = 'complete'
         OR EXISTS (SELECT 1 FROM symptoms s WHERE s.session_id = ms.id)
       )
     GROUP BY ms.id
     ORDER BY ms.started_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Map DB rows → the shape the frontend expects.
  return result.rows.map((row) => {
    const diagnoses = row.diagnoses || [];
    const topCondition = diagnoses.length > 0
      ? [...diagnoses].sort((a, b) => (b.probability || 0) - (a.probability || 0))[0].disease
      : null;

    return {
      id:           row.id,
      date:         row.started_at,
      startedAt:    row.started_at,
      endedAt:      row.ended_at,
      status:       row.status,
      riskLevel:    row.risk_level || 'low',
      summary:      row.summary,
      symptoms:     row.symptoms || [],
      diagnoses,
      topCondition,
    };
  });
};

// ── Save symptoms & diagnoses ─────────────────────────────────

const saveSymptoms = async (sessionId, symptoms) => {
  if (!symptoms || symptoms.length === 0) return;
  for (const name of symptoms) {
    await query(
      'INSERT INTO symptoms (session_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [sessionId, name]
    );
  }
};

const saveDiagnoses = async (sessionId, conditions) => {
  if (!conditions || conditions.length === 0) return;
  for (let i = 0; i < conditions.length; i++) {
    const { disease, probability } = conditions[i];
    await query(
      'INSERT INTO diagnoses (session_id, disease, probability, rank) VALUES ($1,$2,$3,$4)',
      [sessionId, disease, probability, i + 1]
    );
  }
};

const flagEmergency = async (sessionId, userId, reason) => {
  await query(
    'INSERT INTO emergency_flags (session_id, user_id, reason) VALUES ($1,$2,$3)',
    [sessionId, userId, reason]
  );
  await query(
    "UPDATE medical_sessions SET risk_level='high' WHERE id=$1",
    [sessionId]
  );
};

module.exports = {
  getHistory,
  appendMessage,
  createSession,
  getSession,
  completeSession,
  getUserSessions,
  saveSymptoms,
  saveDiagnoses,
  flagEmergency,
};
