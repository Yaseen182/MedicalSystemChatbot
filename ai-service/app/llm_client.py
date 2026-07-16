"""DeepSeek chat client + medical-grade embedding service.

Python port of the original Node `claudeClient.js`:
  - Chat via the OpenAI-compatible DeepSeek API.
  - Embeddings via BGE-M3 (1024-dim) using sentence-transformers, run fully
    locally. Falls back to a deterministic pseudo-embedding if the model can't
    be loaded, keeping the ChromaDB collection dimensionally consistent.
"""

from __future__ import annotations

import math
from typing import List, Optional

from openai import OpenAI

from .config import logger, settings

# ── DeepSeek client ───────────────────────────────────────────────────────────
_deepseek = OpenAI(
    api_key=settings.deepseek_api_key,
    base_url=settings.deepseek_base_url,
)

# ── Embedding model (lazy-loaded singleton) ───────────────────────────────────
_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is not None:
        return _embedder

    from sentence_transformers import SentenceTransformer

    logger.info(
        "Loading embedding model (%s) — first run downloads weights...",
        settings.embedding_model,
    )
    _embedder = SentenceTransformer(settings.embedding_model)
    logger.info("Embedding model ready ✓ (%d-dim)", settings.embedding_dims)
    return _embedder


def _extract_content(message) -> str:
    """Mirror the Node `extractContent`: prefer content, treat reasoning-only
    (token-limit) responses as empty so the caller can retry."""
    content = getattr(message, "content", None)
    if content and content.strip():
        return content.strip()

    reasoning = getattr(message, "reasoning_content", None)
    if reasoning and reasoning.strip():
        logger.warning("DeepSeek: content empty — model hit token limit. Triggering retry.")
        return ""

    logger.warning("DeepSeek: fully empty response")
    return ""


def chat(messages: List[dict], system_prompt: str, max_tokens: int = 1024) -> str:
    """Send a chat completion request to DeepSeek.

    `messages` is a list of {role, content}. `system_prompt` is injected as a
    system message (or merged into the first user turn for reasoning models).
    """
    model = settings.deepseek_model
    logger.debug("DeepSeek request — %d messages, model: %s", len(messages), model)

    is_reasoning_model = "reasoner" in model or "flash" in model

    if is_reasoning_model:
        first = messages[0] if messages else {"content": ""}
        rest = messages[1:]
        formatted = [
            {
                "role": "user",
                "content": f"[Instructions]\n{system_prompt}\n\n[User Message]\n{first.get('content', '')}",
            },
            *rest,
        ]
        effective_max_tokens = max(max_tokens, 2000)
        temperature: Optional[float] = None
    else:
        formatted = [{"role": "system", "content": system_prompt}, *messages]
        effective_max_tokens = max_tokens
        temperature = 0.3

    create_kwargs = {
        "model": model,
        "max_tokens": effective_max_tokens,
        "messages": formatted,
    }
    if temperature is not None:
        create_kwargs["temperature"] = temperature

    response = _deepseek.chat.completions.create(**create_kwargs)

    choice = response.choices[0] if response.choices else None
    finish_reason = choice.finish_reason if choice else None
    logger.debug("DeepSeek finish_reason: %s | usage: %s", finish_reason, response.usage)

    if finish_reason == "length":
        logger.warning("DeepSeek: hit max_tokens limit — response may be truncated")

    if not choice or not choice.message:
        logger.error("DeepSeek: no message in response")
        raise RuntimeError("DeepSeek returned an empty response")

    content = _extract_content(choice.message)
    if not content:
        logger.warning(
            "DeepSeek: extracted content is empty (model=%s, finish=%s)", model, finish_reason
        )

    return content


def embed(text: str, is_query: bool = False) -> List[float]:
    """Generate a 1024-dim BGE-M3 embedding.

    BGE models benefit from an instruction prefix on queries (improves
    retrieval accuracy). Falls back to a deterministic pseudo-embedding on
    failure so RAG never hard-crashes.
    """
    try:
        embedder = _get_embedder()
        # BGE-M3 uses CLS pooling + normalization internally via this model card.
        model_input = f"Represent this medical query: {text}" if is_query else text
        vector = embedder.encode(model_input, normalize_embeddings=True)
        return [float(v) for v in vector.tolist()]
    except Exception as err:  # noqa: BLE001 — graceful fallback like the JS version
        logger.error("Embedding error — falling back to pseudo-embedding: %s", err)
        return _pseudo_embed(text)


def _pseudo_embed(text: str) -> List[float]:
    """Fallback only — NOT suitable for production RAG.

    Dims match BGE-M3 (1024) to keep the ChromaDB collection consistent.
    """
    dims = settings.embedding_dims
    vec = [0.0] * dims
    normalized = text.lower().strip()
    for i, ch in enumerate(normalized):
        idx = i % dims
        vec[idx] = (vec[idx] + ord(ch) * 0.001) % 1
    magnitude = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / magnitude for v in vec]
