from fastapi import APIRouter, HTTPException

from app.schemas.models import OllamaModelResponse
from app.services.ollama import list_models

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("", response_model=list[OllamaModelResponse])
async def get_models():
    try:
        models = await list_models()
        return models
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Cannot reach Ollama: {exc}",
        )