"""MedAI Python AI Service — FastAPI entrypoint.

Exposes the multi-agent medical pipeline (formerly implemented in Node) over
HTTP so the Express backend can consume it as a microservice.

Endpoints:
  GET  /health      — liveness probe
  POST /process     — run the full 6-agent pipeline on a conversation
  POST /rag/query   — raw hybrid RAG retrieval (debug/inspection)
  POST /seed        — load the bundled medical knowledge base into ChromaDB
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import logger, settings
from .orchestrator import process_message
from .rag_service import retrieve_medical_context

app = FastAPI(
    title="MedAI AI Service",
    description="Multi-agent medical consultation pipeline (Python).",
    version="1.0.0",
)


# ── Schemas ───────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str


class ProcessRequest(BaseModel):
    conversationHistory: List[Message] = Field(default_factory=list)
    latestMessage: str


class RagQueryRequest(BaseModel):
    query: str
    topK: int = 5


# ── Routes ────────────────────────────────────────────────────
@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "medai-ai",
        "model": settings.deepseek_model,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/process")
def process(req: ProcessRequest) -> Dict[str, Any]:
    if not req.latestMessage or not req.latestMessage.strip():
        raise HTTPException(status_code=422, detail="latestMessage is required")

    history = [m.model_dump() for m in req.conversationHistory]
    try:
        return process_message(history, req.latestMessage)
    except Exception as err:  # noqa: BLE001
        logger.error("Pipeline error: %s", err)
        raise HTTPException(status_code=500, detail=f"AI pipeline error: {err}") from err


@app.post("/rag/query")
def rag_query(req: RagQueryRequest) -> Dict[str, Any]:
    context = retrieve_medical_context(req.query, req.topK)
    return {"query": req.query, "context": context}


@app.post("/seed")
def seed_endpoint() -> Dict[str, Any]:
    from .seed import seed

    try:
        count = seed()
        return {"status": "ok", "seeded": count}
    except Exception as err:  # noqa: BLE001
        logger.error("Seed failed: %s", err)
        raise HTTPException(status_code=500, detail=f"Seed failed: {err}") from err


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=False)
