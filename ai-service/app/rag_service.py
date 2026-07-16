"""RAG Service — Hybrid Search (Semantic + BM25 Keyword).

Python port of the original Node `ragService.js`.

Combines two retrieval strategies:
  1. Semantic Search — BGE-M3 embeddings via ChromaDB
  2. BM25 Keyword    — TF-IDF style exact/partial keyword matching

Results are fused with Reciprocal Rank Fusion (RRF). Falls back to a small
curated static context when ChromaDB is unavailable or empty.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import Dict, List, Optional

from .config import logger, settings
from .llm_client import embed

# ── Module-level singletons ───────────────────────────────────────────────────
_chroma_client = None
_collection = None
_bm25_index: Optional[dict] = None  # {docs, idf, avg_len}

# ── BM25 hyperparameters ──────────────────────────────────────────────────────
K1 = 1.5  # term frequency saturation
B = 0.75  # length normalization
RRF_K = 60  # reciprocal rank fusion constant


# ─────────────────────────────────────────────────────────────────────────────
# ChromaDB connection
# ─────────────────────────────────────────────────────────────────────────────
def get_collection():
    global _chroma_client, _collection
    if _collection is not None:
        return _collection

    try:
        import chromadb

        _chroma_client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
        )
        _collection = _chroma_client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"description": "MedAI medical knowledge base"},
        )
        count = _collection.count()
        logger.info('ChromaDB ready — "%s" (%d docs)', settings.chroma_collection, count)
        if count == 0:
            logger.warning("ChromaDB collection is EMPTY — run the seed endpoint/script")
    except Exception as err:  # noqa: BLE001
        logger.warning("ChromaDB unavailable — using fallback: %s", err)
        _collection = None

    return _collection


# ─────────────────────────────────────────────────────────────────────────────
# BM25 implementation
# ─────────────────────────────────────────────────────────────────────────────
def _tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    return [t for t in cleaned.split() if len(t) > 2]


def _build_bm25_index(col) -> Optional[dict]:
    global _bm25_index
    if _bm25_index is not None:
        return _bm25_index

    logger.info("Building BM25 index from ChromaDB documents...")
    result = col.get(include=["documents", "metadatas"])
    ids = result.get("ids") or []
    texts = result.get("documents") or []
    metas = result.get("metadatas") or []

    if not ids:
        return None

    tokenized = [_tokenize(t) for t in texts]
    avg_len = sum(len(t) for t in tokenized) / len(tokenized)

    n = len(tokenized)
    df: Counter = Counter()
    for tokens in tokenized:
        for term in set(tokens):
            df[term] += 1

    idf = {term: math.log((n - freq + 0.5) / (freq + 0.5) + 1) for term, freq in df.items()}

    _bm25_index = {
        "docs": [
            {
                "id": ids[i],
                "text": texts[i],
                "disease": (metas[i] or {}).get("disease", "") if i < len(metas) else "",
                "tokens": tokenized[i],
            }
            for i in range(len(ids))
        ],
        "idf": idf,
        "avg_len": avg_len,
    }

    logger.info("BM25 index built — %d documents, %d unique terms", len(ids), len(idf))
    return _bm25_index


def _bm25_score(doc_tokens: List[str], query_terms: List[str], idf: dict, avg_len: float) -> float:
    doc_len = len(doc_tokens)
    tf = Counter(doc_tokens)

    score = 0.0
    for term in query_terms:
        term_idf = idf.get(term, 0.0)
        term_tf = tf.get(term, 0)
        num = term_tf * (K1 + 1)
        den = term_tf + K1 * (1 - B + B * (doc_len / avg_len))
        if den:
            score += term_idf * (num / den)
    return score


def _bm25_search(query: str, top_k: int) -> List[dict]:
    if not _bm25_index:
        return []

    query_terms = _tokenize(query)
    if not query_terms:
        return []

    scored = [
        {
            "id": doc["id"],
            "text": doc["text"],
            "disease": doc["disease"],
            "score": _bm25_score(doc["tokens"], query_terms, _bm25_index["idf"], _bm25_index["avg_len"]),
        }
        for doc in _bm25_index["docs"]
    ]

    scored = [d for d in scored if d["score"] > 0]
    scored.sort(key=lambda d: d["score"], reverse=True)
    return scored[:top_k]


# ─────────────────────────────────────────────────────────────────────────────
# Reciprocal Rank Fusion (RRF)
# ─────────────────────────────────────────────────────────────────────────────
def _reciprocal_rank_fusion(
    semantic_results: List[dict], keyword_results: List[dict], top_k: int
) -> List[dict]:
    scores: Dict[str, dict] = {}

    def add_results(results: List[dict], list_weight: float = 1.0) -> None:
        for rank, item in enumerate(results):
            rrf_score = list_weight / (RRF_K + rank + 1)
            doc_id = item["id"]
            if doc_id in scores:
                scores[doc_id]["rrf_score"] += rrf_score
            else:
                scores[doc_id] = {
                    "rrf_score": rrf_score,
                    "text": item["text"],
                    "disease": item.get("disease", ""),
                }

    # Semantic results weighted slightly higher (better for medical synonyms)
    add_results(semantic_results, 1.2)
    add_results(keyword_results, 1.0)

    fused = [{"id": doc_id, **val} for doc_id, val in scores.items()]
    fused.sort(key=lambda d: d["rrf_score"], reverse=True)
    return fused[:top_k]


# ─────────────────────────────────────────────────────────────────────────────
# Main retrieval function
# ─────────────────────────────────────────────────────────────────────────────
def retrieve_medical_context(query: str, top_k: int = 5) -> str:
    if not query or not query.strip():
        return _get_fallback_context("")

    col = get_collection()
    if col is None:
        return _get_fallback_context(query)

    try:
        count = col.count()
        if count == 0:
            return _get_fallback_context(query)

        _build_bm25_index(col)

        # ── 1. Semantic search (BGE-M3 with query prefix) ──────────────────────
        query_embedding = embed(query, is_query=True)
        semantic_raw = col.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k * 2, count),
            include=["documents", "metadatas", "distances"],
        )

        docs = (semantic_raw.get("documents") or [[]])[0]
        ids = (semantic_raw.get("ids") or [[]])[0]
        metas = (semantic_raw.get("metadatas") or [[]])[0]
        distances = (semantic_raw.get("distances") or [[]])[0]

        semantic_results = []
        for i, text in enumerate(docs):
            distance = distances[i] if i < len(distances) else 1
            if distance >= 1.5:  # filter irrelevant
                continue
            semantic_results.append(
                {
                    "id": ids[i] if i < len(ids) else f"sem_{i}",
                    "text": text,
                    "disease": (metas[i] or {}).get("disease", "") if i < len(metas) else "",
                    "distance": distance,
                }
            )

        # ── 2. BM25 keyword search ──────────────────────────────────────────────
        keyword_results = _bm25_search(query, top_k * 2)

        logger.debug(
            "Hybrid RAG — semantic: %d, keyword: %d results",
            len(semantic_results),
            len(keyword_results),
        )

        # ── 3. Fuse with RRF ────────────────────────────────────────────────────
        fused = _reciprocal_rank_fusion(semantic_results, keyword_results, top_k)

        if not fused:
            logger.warning("Hybrid RAG: no results after fusion — using fallback")
            return _get_fallback_context(query)

        logger.debug('RAG: returning %d fused results for "%s"', len(fused), query[:60])

        parts = []
        for item in fused:
            header = f"[Disease: {item['disease']}]" if item.get("disease") else ""
            parts.append(f"{header}\n{item['text']}".strip())
        return "\n\n---\n\n".join(parts)

    except Exception as err:  # noqa: BLE001
        logger.warning("RAG retrieval error: %s", err)
        return _get_fallback_context(query)


# ─────────────────────────────────────────────────────────────────────────────
# Add documents
# ─────────────────────────────────────────────────────────────────────────────
def add_documents(docs: List[dict]) -> None:
    global _bm25_index
    col = get_collection()
    if col is None:
        raise RuntimeError("ChromaDB not available")

    ids = [d["id"] for d in docs]
    texts = [d["text"] for d in docs]
    metadatas = [
        {
            "source": d.get("source", ""),
            "category": d.get("category", ""),
            "disease": d.get("disease", ""),
        }
        for d in docs
    ]
    embeddings = [embed(t, is_query=False) for t in texts]

    col.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    _bm25_index = None  # invalidate so it rebuilds on next query
    logger.info("Added %d documents to ChromaDB", len(docs))


# ─────────────────────────────────────────────────────────────────────────────
# Static fallback
# ─────────────────────────────────────────────────────────────────────────────
def _get_fallback_context(query: str) -> str:
    q = (query or "").lower()
    contexts: List[str] = []

    if "fever" in q or "temperature" in q:
        contexts.append(
            "[Source: CDC]\nFever (>38°C) is a common immune response. Seek care if >39.4°C, "
            "lasts >3 days, or comes with stiff neck/rash."
        )
    if "headache" in q:
        contexts.append(
            "[Source: Mayo Clinic]\nRed flags: thunderclap onset, fever + stiff neck, post-trauma, vision changes."
        )
    if "chest pain" in q:
        contexts.append(
            "[Source: AHA]\nChest pain is a medical emergency until proven otherwise. Cardiac pain: "
            "crushing, radiates to arm/jaw. Call emergency services."
        )
    if "cough" in q:
        contexts.append(
            "[Source: WHO]\nAcute cough (<3 weeks): usually viral. Productive cough + fever may indicate pneumonia."
        )
    if "nausea" in q or "vomiting" in q:
        contexts.append(
            "[Source: MedlinePlus]\nSeek care if vomiting is persistent, contains blood, or with severe abdominal pain."
        )
    if "fatigue" in q or "tired" in q:
        contexts.append(
            "[Source: CDC]\nFatigue with fever and myalgia may indicate viral illness. Chronic fatigue >6 months "
            "requires evaluation."
        )
    if "shortness of breath" in q or "breathing" in q:
        contexts.append(
            "[Source: ATS]\nAcute dyspnea: PE, pneumothorax, heart failure are emergencies. "
            "Wheeze → asthma; fever/cough → pneumonia."
        )
    if "rash" in q:
        contexts.append(
            "[Source: AAD]\nNon-blanching petechial rash with fever = possible meningococcemia — EMERGENCY."
        )

    if contexts:
        return "\n\n---\n\n".join(contexts)
    return (
        "[Source: WHO]\nSymptoms should be evaluated by a qualified healthcare professional. "
        "Fever, difficulty breathing, chest pain, or altered consciousness warrants immediate attention."
    )
