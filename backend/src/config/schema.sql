-- MedAI Database Schema
-- Run with: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MEDICAL SESSIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'complete' | 'abandoned'
  risk_level  VARCHAR(10),                            -- 'low' | 'medium' | 'high'
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  summary     TEXT
);

-- ─── CONVERSATION MESSAGES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES medical_sessions(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL,   -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SYMPTOMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS symptoms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES medical_sessions(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  severity    VARCHAR(10),   -- 'mild' | 'moderate' | 'severe'
  duration    VARCHAR(100),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DIAGNOSES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diagnoses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES medical_sessions(id) ON DELETE CASCADE,
  disease     VARCHAR(255) NOT NULL,
  probability INTEGER NOT NULL CHECK (probability BETWEEN 0 AND 100),
  rank        INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MEDICAL REPORTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES medical_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EMERGENCY FLAGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES medical_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user       ON medical_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session    ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_session    ON symptoms(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_session   ON diagnoses(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_user        ON medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_flags_resolved      ON emergency_flags(resolved);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
