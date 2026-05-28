"""Document upload, analysis, and knowledge source endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.schemas.documents import AnalyzeResponse, DocumentUploadResponse, KnowledgeSourceResponse
from app.services.extraction import extract_text, get_file_type
from app.services.rag import process_document_for_rag
from app.services.embeddings import check_embedding_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

SUPPORTED_EXTENSIONS = {"pdf", "docx", "txt"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(file: UploadFile = File(...)):
    """Extract text from an uploaded file for one-shot analysis. No persistence."""
    filename = file.filename or "unknown"
    file_type = get_file_type(filename)
    if not file_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB.",
        )

    text = extract_text(file_bytes, file_type)
    if text.startswith("Failed") or text.startswith("Unsupported"):
        raise HTTPException(status_code=422, detail=text)

    return AnalyzeResponse(text=text, file_name=filename)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a file as a knowledge source for RAG. Extract, chunk, embed, store."""
    filename = file.filename or "unknown"
    file_type = get_file_type(filename)
    if not file_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB.",
        )

    model_available = await check_embedding_model()
    if not model_available:
        raise HTTPException(
            status_code=503,
            detail=f"Embedding model '{settings.embedding_model}' is not available. "
                   f"Please run: ollama pull {settings.embedding_model}",
        )

    try:
        source = await process_document_for_rag(file_bytes, filename, file_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to process document for RAG")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {exc}")

    return DocumentUploadResponse(
        id=source.id,
        name=source.name,
        file_type=source.file_type,
        chunk_count=source.chunk_count,
        created_at=source.created_at,
    )


@router.get("/knowledge-sources", response_model=list[KnowledgeSourceResponse])
async def list_knowledge_sources():
    """List all knowledge sources with their chunk counts."""
    from app.database import async_session
    from app.models import KnowledgeSource
    from sqlalchemy import select

    async with async_session() as session:
        result = await session.execute(
            select(KnowledgeSource).order_by(KnowledgeSource.created_at.desc())
        )
        sources = result.scalars().all()

    return [
        KnowledgeSourceResponse(
            id=s.id,
            name=s.name,
            file_type=s.file_type,
            chunk_count=s.chunk_count,
            created_at=s.created_at,
        )
        for s in sources
    ]


@router.delete("/knowledge-sources/{source_id}", status_code=204)
async def delete_knowledge_source(source_id: int):
    """Delete a knowledge source and all its chunks."""
    from app.database import async_session
    from app.models import KnowledgeSource
    from sqlalchemy import delete

    async with async_session() as session:
        result = await session.execute(
            delete(KnowledgeSource).where(KnowledgeSource.id == source_id)
        )
        await session.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Knowledge source not found")