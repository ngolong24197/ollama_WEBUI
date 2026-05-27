from datetime import datetime

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    title: str = Field(default="New Chat", max_length=500)
    model: str = Field(..., min_length=1, max_length=100)
    system_prompt: str | None = None


class ConversationUpdate(BaseModel):
    title: str | None = None
    model: str | None = None
    system_prompt: str | None = None


class ConversationResponse(BaseModel):
    id: int
    title: str
    model: str
    system_prompt: str | None
    total_tokens: int
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    prompt_tokens: int
    completion_tokens: int
    image_urls: str | None
    created_at: datetime