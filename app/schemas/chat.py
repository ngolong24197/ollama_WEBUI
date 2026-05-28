from pydantic import Field

from app.schemas.base import CamelModel


class ChatRequest(CamelModel):
    message: str = Field(default="", max_length=50000)
    model: str = Field(..., min_length=1, max_length=100)
    conversation_id: int | None = None
    system_prompt: str | None = None
    image_urls: list[str] | None = None
    enable_search: bool = False
    knowledge_source_ids: list[int] | None = None


class TokenCount(CamelModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0