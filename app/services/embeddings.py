"""Embedding generation, text chunking, and similarity retrieval."""

from __future__ import annotations

import json
import logging
import math
from typing import Sequence

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def generate_embedding(text: str, model: str | None = None) -> list[float]:
    """Generate an embedding vector for the given text via Ollama."""
    model = model or settings.embedding_model
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.ollama_url}/api/embeddings",
            json={"model": model, "prompt": text},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("embedding", [])


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[str]:
    """Split text into overlapping chunks, preferring sentence boundaries."""
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    if len(text) <= chunk_size:
        return [text] if text.strip() else []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # try to break at sentence boundary
        if end < len(text):
            boundary = text.rfind(". ", start, end)
            if boundary > start:
                end = boundary + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap
        if start >= len(text):
            break

    return chunks


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def retrieve_relevant_chunks(
    source_ids: list[int],
    query_embedding: list[float],
    top_k: int = 5,
) -> list[tuple[str, str, float]]:
    """Retrieve the most relevant chunks from specified knowledge sources.

    Returns list of (content, source_name, score) tuples sorted by relevance.
    """
    from app.database import async_session
    from app.models import DocumentChunk, KnowledgeSource
    from sqlalchemy import select

    async with async_session() as session:
        # fetch all chunks for the specified sources
        result = await session.execute(
            select(DocumentChunk, KnowledgeSource.name)
            .join(KnowledgeSource, DocumentChunk.source_id == KnowledgeSource.id)
            .where(DocumentChunk.source_id.in_(source_ids))
        )
        rows = result.all()

    scored: list[tuple[str, str, float]] = []
    for chunk, source_name in rows:
        try:
            embedding = json.loads(chunk.embedding) if chunk.embedding else []
        except (json.JSONDecodeError, TypeError):
            continue
        if not embedding:
            continue
        score = cosine_similarity(query_embedding, embedding)
        scored.append((chunk.content, source_name, score))

    scored.sort(key=lambda x: x[2], reverse=True)
    return scored[:top_k]


async def check_embedding_model() -> bool:
    """Check if the configured embedding model is available in Ollama."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.ollama_url}/api/tags", timeout=5.0
            )
            if resp.status_code != 200:
                return False
            models = [m["name"] for m in resp.json().get("models", [])]
            return any(m.startswith(settings.embedding_model) for m in models)
    except Exception:
        return False