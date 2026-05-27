from fastapi import APIRouter, Query

from app.schemas.error import ErrorResponse
from app.services.search import search as search_web

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(q: str = Query(..., min_length=1, max_length=500)):
    """Search the web via SearXNG."""
    try:
        results = await search_web(q)
        return results
    except RuntimeError as exc:
        return ErrorResponse(error="search_unavailable", detail=str(exc))