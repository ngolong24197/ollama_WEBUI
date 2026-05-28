"""RAG orchestration — document processing and context retrieval."""

from __future__ import annotations

import json
import logging

from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models import DocumentChunk, KnowledgeSource
from app.services.embeddings import chunk_text, generate_embedding, retrieve_relevant_chunks
from app.services.extraction import extract_text, get_file_type
from app.services.summarizer import generate_summary

logger = logging.getLogger(__name__)

_RAG_SYSTEM_PROMPT = (
    "The context blocks contain document summaries and relevant excerpts from the user's "
    "knowledge sources. Use this information to answer their question. "
    "Always cite your sources by document name when drawing from the retrieved context. "
    "If the context doesn't contain relevant information, say so honestly and answer from "
    "your training data with a caveat that you are not citing the uploaded documents."
)


def format_rag_context(
    chunks: list[tuple[str, str, float]],
    summaries: list[tuple[str, str | None]] | None = None,
) -> str:
    """Format summaries and retrieved chunks as a RAG context block."""
    parts: list[str] = []

    if summaries:
        summary_lines = ["[Document Summaries]"]
        for source_name, summary in summaries:
            if summary:
                summary_lines.append(f"Source: {source_name}")
                summary_lines.append(summary)
                summary_lines.append("")
        summary_lines.append("[End of Document Summaries]")
        if len(summary_lines) > 3:
            parts.append("\n".join(summary_lines))

    if chunks:
        chunk_lines = ["[Retrieved Context from Knowledge Sources]"]
        for content, source_name, score in chunks:
            chunk_lines.append(f"Source: {source_name} (relevance: {score:.2f})")
            chunk_lines.append(content)
            chunk_lines.append("")
        chunk_lines.append("[End of Retrieved Context]")
        parts.append("\n".join(chunk_lines))

    return "\n\n".join(parts)


async def process_document_for_rag(
    file_bytes: bytes,
    filename: str,
    file_type: str,
    embedding_model: str | None = None,
) -> KnowledgeSource:
    """Full RAG pipeline: extract, summarize, chunk, embed, store."""
    model = embedding_model or settings.embedding_model

    # extract text
    text = extract_text(file_bytes, file_type)
    if text.startswith("Failed") or text.startswith("Unsupported"):
        raise ValueError(text)

    # generate summary (best-effort, None on failure)
    summary = await generate_summary(text)

    # chunk
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No text could be extracted from the file.")

    # generate embeddings
    embedded_chunks: list[tuple[str, list[float]]] = []
    for chunk in chunks:
        embedding = await generate_embedding(chunk, model=model)
        embedded_chunks.append((chunk, embedding))

    # store in database
    async with async_session() as session:
        source = KnowledgeSource(
            name=filename,
            file_type=file_type,
            chunk_count=len(chunks),
            summary=summary,
        )
        session.add(source)
        await session.flush()

        for idx, (content, embedding) in enumerate(embedded_chunks):
            chunk_row = DocumentChunk(
                source_id=source.id,
                chunk_index=idx,
                content=content,
                embedding=json.dumps(embedding),
            )
            session.add(chunk_row)

        await session.commit()
        await session.refresh(source)

    return source


async def retrieve_summaries(source_ids: list[int]) -> list[tuple[str, str | None]]:
    """Fetch summaries for the given knowledge source IDs."""
    async with async_session() as session:
        result = await session.execute(
            select(KnowledgeSource.name, KnowledgeSource.summary)
            .where(KnowledgeSource.id.in_(source_ids))
        )
        return result.all()


async def retrieve_context(
    query: str,
    source_ids: list[int],
    embedding_model: str | None = None,
    top_k: int | None = None,
) -> str:
    """Generate query embedding, retrieve summaries and relevant chunks, format context."""
    k = top_k or settings.top_k
    model = embedding_model or settings.embedding_model
    query_embedding = await generate_embedding(query, model=model)
    chunks = await retrieve_relevant_chunks(source_ids, query_embedding, top_k=k)
    summaries = await retrieve_summaries(source_ids)
    return format_rag_context(chunks, summaries)