"""RAG orchestration — document processing and context retrieval."""

from __future__ import annotations

import json
import logging

from app.config import settings
from app.database import async_session
from app.models import DocumentChunk, KnowledgeSource
from app.services.embeddings import chunk_text, generate_embedding, retrieve_relevant_chunks
from app.services.extraction import extract_text, get_file_type

logger = logging.getLogger(__name__)

_RAG_SYSTEM_PROMPT = (
    "The [Retrieved Context] block contains relevant excerpts from the user's "
    "knowledge sources. Use this information to answer their question. "
    "Cite the source name when possible. If the context doesn't contain relevant "
    "information, say so honestly and answer from your training data with a caveat."
)

_ANALYSIS_SYSTEM_PROMPT = (
    "The user has provided a document for analysis. Answer their question based "
    "on the document content. If the answer isn't in the document, say so honestly."
)


def format_analysis_context(text: str, filename: str) -> str:
    """Format extracted text as a document analysis context block."""
    return f"[Document: {filename}]\n{text}\n[End of Document]"


def format_rag_context(chunks: list[tuple[str, str, float]]) -> str:
    """Format retrieved chunks as a RAG context block."""
    if not chunks:
        return ""
    lines = ["[Retrieved Context from Knowledge Sources]"]
    for content, source_name, score in chunks:
        lines.append(f"Source: {source_name} (relevance: {score:.2f})")
        lines.append(content)
        lines.append("")
    lines.append("[End of Retrieved Context]")
    return "\n".join(lines)


async def process_document_for_rag(
    file_bytes: bytes,
    filename: str,
    file_type: str,
    embedding_model: str | None = None,
) -> KnowledgeSource:
    """Full RAG pipeline: extract, chunk, embed, store."""
    model = embedding_model or settings.embedding_model

    # extract text
    text = extract_text(file_bytes, file_type)
    if text.startswith("Failed") or text.startswith("Unsupported"):
        raise ValueError(text)

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


async def retrieve_context(
    query: str,
    source_ids: list[int],
    embedding_model: str | None = None,
    top_k: int = 5,
) -> str:
    """Generate query embedding, retrieve relevant chunks, format context."""
    model = embedding_model or settings.embedding_model
    query_embedding = await generate_embedding(query, model=model)
    chunks = await retrieve_relevant_chunks(source_ids, query_embedding, top_k=top_k)
    return format_rag_context(chunks)