"""Central configuration for the MedAI Python AI service.

Values are read from environment variables (or a local .env file) so the
service mirrors the same configuration surface as the Node backend.
"""

import logging
import os
from functools import lru_cache
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── Service ──────────────────────────────────────────────
    port: int = int(os.getenv("AI_SERVICE_PORT", "8001"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # ── DeepSeek (OpenAI-compatible) ─────────────────────────
    deepseek_api_key: str = os.getenv("DEEPSEEK_API_KEY", "")
    deepseek_model: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    deepseek_base_url: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    # ── Embeddings ───────────────────────────────────────────
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
    embedding_dims: int = 1024  # BGE-M3 output dimension

    # ── ChromaDB ─────────────────────────────────────────────
    chroma_url: str = os.getenv("CHROMA_URL", "http://localhost:8000")
    chroma_collection: str = os.getenv("CHROMA_COLLECTION", "medai_knowledge")

    @property
    def chroma_host(self) -> str:
        return urlparse(self.chroma_url).hostname or "localhost"

    @property
    def chroma_port(self) -> int:
        return urlparse(self.chroma_url).port or 8000


@lru_cache
def get_settings() -> Settings:
    return Settings()


def configure_logging() -> logging.Logger:
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    return logging.getLogger("medai-ai")


logger = configure_logging()
settings = get_settings()
