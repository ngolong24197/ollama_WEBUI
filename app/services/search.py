"""Async SearXNG search client."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import settings

_SEARCH_TIMEOUT = 10.0


async def search(query: str) -> list[dict[str, str]]:
    """Search SearXNG and return a list of SearchResult dicts.

    Each result dict has keys: title, url, snippet.
    """
    params = {"q": query, "format": "json", "categories": "general"}
    try:
        async with httpx.AsyncClient(timeout=_SEARCH_TIMEOUT) as client:
            response = await client.get(
                f"{settings.searxng_url}/search", params=params
            )
    except httpx.TimeoutException:
        raise RuntimeError("Search request timed out.")
    except httpx.HTTPError:
        raise RuntimeError("Search is unavailable. SearXNG may not be running.")

    if response.status_code != 200:
        raise RuntimeError("Search is unavailable. SearXNG may not be running.")

    data: dict[str, Any] = response.json()
    results: list[dict[str, str]] = data.get("results", [])

    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("content", ""),
        }
        for r in results
    ]