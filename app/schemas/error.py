from app.schemas.base import CamelModel


class ErrorResponse(CamelModel):
    error: str
    detail: str