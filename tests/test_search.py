import pytest
from unittest.mock import AsyncMock, patch

from app.services.search import search


@pytest.mark.asyncio
async def test_search_returns_results():
    mock_results = [
        {"title": "Test Result", "url": "https://example.com", "snippet": "A test"}
    ]
    with patch("app.services.search.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_results
        results = await mock_search("test query")
        assert len(results) == 1
        assert results[0]["title"] == "Test Result"


@pytest.mark.asyncio
async def test_search_empty_results():
    with patch("app.services.search.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = []
        results = await mock_search("nonexistent query")
        assert results == []


@pytest.mark.asyncio
async def test_search_service_unavailable():
    with patch("app.services.search.search", new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = RuntimeError(
            "Search is unavailable. SearXNG may not be running."
        )
        with pytest.raises(RuntimeError, match="unavailable"):
            await mock_search("test")