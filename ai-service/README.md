# 🧠 MedAI — Python AI Service

The AI brain of MedAI, implemented in **Python (FastAPI)**. It runs the full
multi-agent medical consultation pipeline and the hybrid RAG retrieval that
were previously written in JavaScript.

The Node/Express backend no longer runs any AI logic itself — it calls this
service over HTTP.

---

## 🏗 Architecture

```
Frontend (React)
      │  HTTP + JWT
      ▼
Backend (Node / Express)  ──HTTP──►  AI Service (Python / FastAPI)  ◄──►  DeepSeek API
      │                                       │
   PostgreSQL                            ChromaDB (RAG)
   Redis
```

The 6 agents (all in `app/orchestrator.py`):

1. **Symptom Extractor** — structured symptom JSON
2. **Follow-up Generator** — next triage question / readiness / emergency token
3. **Knowledge Retriever (RAG)** — hybrid semantic + BM25 search (`app/rag_service.py`)
4. **Disease Ranker** — differential diagnosis with probabilities
5. **Safety Validator** — guards against unsafe medical content
6. **Response Generator** — final compassionate patient-facing reply

---

## 📂 Structure

```
ai-service/
├── app/
│   ├── main.py           # FastAPI app + endpoints
│   ├── config.py         # env-driven settings + logging
│   ├── llm_client.py     # DeepSeek chat + BGE-M3 embeddings
│   ├── prompts.py        # system prompts for the 6 agents
│   ├── rag_service.py    # ChromaDB + BM25 + RRF hybrid retrieval
│   ├── orchestrator.py   # 6-agent pipeline (process_message)
│   └── seed.py           # medical knowledge base seeder
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## 🚀 Quick Start (local)

```bash
cd ai-service
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/macOS:  source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # then fill in DEEPSEEK_API_KEY

uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Seed the knowledge base (ChromaDB must be running):

```bash
python -m app.seed
# or, once the service is up:
curl -X POST http://localhost:8001/seed
```

---

## 🔌 API

| Method | Path        | Description                                   |
|--------|-------------|-----------------------------------------------|
| GET    | `/health`   | Liveness + active model                       |
| POST   | `/process`  | Run the full pipeline on a conversation       |
| POST   | `/rag/query`| Inspect raw hybrid RAG retrieval              |
| POST   | `/seed`     | Load the bundled medical knowledge base       |

### `POST /process`

Request:

```json
{
  "conversationHistory": [
    { "role": "user", "content": "I have a headache" },
    { "role": "assistant", "content": "How long have you had it?" }
  ],
  "latestMessage": "About 3 days, and now I have a fever"
}
```

Response (shape consumed by the Node backend):

```json
{
  "type": "analysis | followup | emergency",
  "message": "string",
  "extractedSymptoms": { "symptoms": ["..."], "duration": "...", "severity": "..." },
  "diagnoses": [{ "disease": "...", "probability": 70, "reasoning": "..." }],
  "recommendation": "string",
  "seekEmergencyCare": false,
  "isComplete": true,
  "safetyIssues": []
}
```

---

## ⚙️ Configuration

All via environment variables (see `.env.example`):

| Variable            | Default                     | Description                       |
|---------------------|-----------------------------|-----------------------------------|
| `AI_SERVICE_PORT`   | `8001`                      | Port FastAPI listens on           |
| `DEEPSEEK_API_KEY`  | —                           | DeepSeek API key                  |
| `DEEPSEEK_MODEL`    | `deepseek-chat`             | Chat model                        |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com`  | OpenAI-compatible base URL        |
| `EMBEDDING_MODEL`   | `BAAI/bge-m3`               | Local embedding model (1024-dim)  |
| `CHROMA_URL`        | `http://localhost:8000`     | ChromaDB endpoint                 |
| `CHROMA_COLLECTION` | `medai_knowledge`           | ChromaDB collection name          |

> The first embedding call downloads the BGE-M3 weights. If the model can't be
> loaded, the service falls back to a deterministic pseudo-embedding so RAG
> never hard-crashes (not suitable for production retrieval quality).
