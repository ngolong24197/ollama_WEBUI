"""Pydantic schemas for document endpoints."""

from datetime import datetime

from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    id: int
    name: str
    file_type: str
    chunk_count: int
    created_at: datetime


class AnalyzeResponse(BaseModel):
    text: str
    file_name: str


class KnowledgeSourceResponse(BaseModel):
    id: int
    name: str
    file_type: str
    chunk_count: int
    created_at: datetime