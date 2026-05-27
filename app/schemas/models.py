from pydantic import BaseModel


class OllamaModelResponse(BaseModel):
    name: str
    modified_at: str
    size: int