# MedAI Backend 🏥 — Groq / Llama Edition

> AI-powered medical symptom checker — Node.js/Express REST API  
> Uses **Llama 3 via Groq** + RAG (ChromaDB) + PostgreSQL + Redis

---

## ⚠️ Disclaimer

**This system is NOT a medical diagnosis tool.**  
Always display: *"This is not a medical diagnosis. Please consult a healthcare professional."*

---

## 📁 Project Structure

```
medai-backend/
├── src/
│   ├── server.js                  # HTTP server entry point
│   ├── app.js                     # Express app & middleware
│   │
│   ├── config/
│   │   ├── index.js               # Config from env vars (Groq settings here)
│   │   ├── database.js            # PostgreSQL pool
│   │   ├── redis.js               # Redis helpers
│   │   └── schema.sql             # DB schema
│   │
│   ├── ai/
│   │   ├── claudeClient.js        # ← Groq/Llama client (renamed kept for compatibility)
│   │   ├── prompts.js             # System prompts tuned for Llama 3
│   │   └── orchestrator.js        # 6-agent pipeline
│   │
│   ├── rag/
│   │   └── ragService.js          # ChromaDB + static fallback context
│   │
│   ├── middleware/
│   │   ├── auth.js                # JWT verify + requireAdmin
│   │   ├── rateLimiter.js         # Rate limiting configs
│   │   └── errorHandler.js        # Central error handler
│   │
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── chat.js                # /api/chat/*
│   │   ├── dashboard.js           # /api/dashboard/*
│   │   └── admin.js               # /api/admin/*
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── sessionService.js
│   │   └── reportService.js
│   │
│   └── utils/
│       ├── logger.js
│       └── seedMedical.js         # Seeds ChromaDB with medical docs
│
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
# 1. Enter folder
cd medai-backend

# 2. Copy env and add your Groq key
cp .env.example .env
nano .env   # → set GROQ_API_KEY=gsk_xxxxxxxxxxxx

# 3. Start all services
docker-compose up -d

# 4. Seed medical knowledge into ChromaDB
docker-compose exec api node src/utils/seedMedical.js

# API running at http://localhost:4000
```

### Option B — Local Dev

```bash
npm install
cp .env.example .env     # → fill GROQ_API_KEY

# Start Postgres, Redis, ChromaDB (via Docker or locally)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=medai_pass postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 8000:8000 chromadb/chroma

# Init DB schema
psql $DATABASE_URL -f src/config/schema.sql

# Seed medical docs
node src/utils/seedMedical.js

# Start server
npm run dev
```

---

## 🔑 Environment Variables

| Variable        | Required | Description                                        |
|-----------------|----------|----------------------------------------------------|
| `GROQ_API_KEY`  | ✅        | Your Groq API key (`gsk_...`)                      |
| `GROQ_MODEL`    | ✅        | Model to use (default: `llama3-70b-8192`)          |
| `DATABASE_URL`  | ✅        | PostgreSQL connection string                       |
| `JWT_SECRET`    | ✅        | Secret for JWT signing (min 32 chars)              |
| `REDIS_URL`     | ⬜        | Redis URL — caching degrades gracefully if missing |
| `CHROMA_URL`    | ⬜        | ChromaDB URL — has static fallback if missing      |
| `PORT`          | ⬜        | HTTP port (default: 4000)                          |
| `FRONTEND_URL`  | ⬜        | CORS origin (default: http://localhost:3000)       |

### Available Groq / Llama Models

| Model                     | Context | Best for               |
|---------------------------|---------|------------------------|
| `llama3-70b-8192`         | 8K      | ✅ Best quality (default) |
| `llama3-8b-8192`          | 8K      | Faster / cheaper       |
| `mixtral-8x7b-32768`      | 32K     | Long conversations     |
| `gemma2-9b-it`            | 8K      | Lightweight alternative|

Set in `.env`:
```
GROQ_MODEL=llama3-70b-8192
```

---

## 📡 API Reference

### Auth

| Method | Endpoint             | Auth | Description       |
|--------|----------------------|------|-------------------|
| POST   | `/api/auth/register` | ❌    | Create account    |
| POST   | `/api/auth/login`    | ❌    | Login → JWT token |
| GET    | `/api/auth/me`       | ✅    | Get own profile   |

**Register:**
```json
{ "name": "Jane", "email": "jane@example.com", "password": "password123" }
```

**Login response:**
```json
{
  "user": { "id": "uuid", "name": "Jane", "email": "...", "role": "user" },
  "token": "eyJhbGci..."
}
```

---

### Chat (AI — Llama powered)

| Method | Endpoint                       | Auth | Description              |
|--------|--------------------------------|------|--------------------------|
| POST   | `/api/chat/session`            | ✅    | Start new session        |
| POST   | `/api/chat/message`            | ✅    | Send message to Llama AI |
| GET    | `/api/chat/history/:sessionId` | ✅    | Get conversation history |

**Send message:**
```json
{ "sessionId": "uuid", "message": "I have a headache and fever for 2 days" }
```

**Follow-up response:**
```json
{
  "type": "followup",
  "message": "On a scale of 1–10, how severe is your headache?",
  "isComplete": false,
  "extractedSymptoms": { "symptoms": ["headache", "fever"], "duration": "2 days" }
}
```

**Analysis response:**
```json
{
  "type": "analysis",
  "message": "Based on your symptoms, influenza is most likely...\n\nThis is not a medical diagnosis. Please consult a healthcare professional.",
  "isComplete": true,
  "diagnoses": [
    { "disease": "Influenza", "probability": 72, "reasoning": "Fever + headache + 2-day duration" },
    { "disease": "COVID-19",  "probability": 18, "reasoning": "Overlapping symptom profile" }
  ],
  "recommendation": "See a doctor within 24 hours.",
  "seekEmergencyCare": false
}
```

**Emergency response:**
```json
{
  "type": "emergency",
  "message": "⚠️ Your symptoms may require immediate emergency care. Call 911 now.",
  "seekEmergencyCare": true
}
```

---

### Dashboard

| Method | Endpoint                      | Auth | Description         |
|--------|-------------------------------|------|---------------------|
| GET    | `/api/dashboard/stats`        | ✅    | User stats overview |
| GET    | `/api/dashboard/sessions`     | ✅    | Session history     |
| GET    | `/api/dashboard/reports`      | ✅    | Saved reports       |
| GET    | `/api/dashboard/reports/:id`  | ✅    | Single report       |
| GET    | `/api/dashboard/risk-history` | ✅    | Monthly risk chart  |

---

### Admin

| Method | Endpoint                       | Auth | Description          |
|--------|--------------------------------|------|----------------------|
| GET    | `/api/admin/stats`             | 🔐   | System stats         |
| GET    | `/api/admin/conversations`     | 🔐   | All conversations    |
| GET    | `/api/admin/flags`             | 🔐   | Emergency flags      |
| PATCH  | `/api/admin/flags/:id/resolve` | 🔐   | Resolve a flag       |
| GET    | `/api/admin/users`             | 🔐   | All users            |

Make admin:
```sql
UPDATE users SET role='admin' WHERE email='admin@example.com';
```

---

## 🤖 Multi-Agent AI Pipeline (Llama 3)

```
User Message
     │
[Agent 1] Symptom Extractor      → JSON structured symptoms
     │
[Agent 2] Follow-up Generator    → ask more? / emergency? / ready?
     ├── followup  → return question
     ├── emergency → return warning
     └── analyze ──────────────────────┐
                                       │
                          [Agent 3] RAG Retriever
                            → ChromaDB medical context
                                       │
                          [Agent 4] Disease Ranker
                            → probability list JSON
                                       │
                          [Agent 6] Response Generator
                            → patient-friendly message
                                       │
                          [Agent 5] Safety Validator
                            → check + correct if needed
                                       │
                                Final Response
```

---

## 🔒 Security

- JWT auth, bcrypt password hashing (12 rounds)
- Helmet HTTP headers, CORS restricted to frontend URL
- Rate limiting: 100 req/15min global, 20 req/15min AI, 10 req/15min auth
- Input validation via express-validator
- Parameterised SQL (no injection risk)

---

## 🩺 RAG Medical Knowledge

ChromaDB stores embeddings from:
- **WHO** — Global disease guidelines
- **CDC** — Disease database
- **Mayo Clinic** — Clinical descriptions
- **MedlinePlus** — Patient encyclopedia

Seed: `node src/utils/seedMedical.js`

If ChromaDB is unavailable, the system falls back to built-in static context for common symptoms.

---

## 🧪 Health Check

```bash
curl http://localhost:4000/health
# → { "status": "ok", "version": "1.0.0", "timestamp": "..." }
```

---

## 📄 License

MIT — educational and research use only. **Not for clinical use.**
