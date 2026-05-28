from app.schemas.base import CamelModel


class OllamaModelResponse(CamelModel):
    name: str
    modified_at: str
    size: int