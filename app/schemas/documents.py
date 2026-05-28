"""Pydantic schemas for document endpoints."""

from datetime import datetime

from app.schemas.base import CamelModel


class DocumentUploadResponse(CamelModel):
    id: int
    name: str
    file_type: str
    chunk_count: int
    summary: str | None = None
    created_at: datetime


class KnowledgeSourceResponse(CamelModel):
    id: int
    name: str
    file_type: str
    chunk_count: int
    summary: str | None = None
    created_at: datetime