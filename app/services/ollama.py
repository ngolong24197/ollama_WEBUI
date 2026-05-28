"""Async Ollama API client for streaming chat responses."""

import json
from typing import AsyncGenerator

import httpx

from app.config import settings


async def list_models() -> list[str]:
    """Return a list of available model names from Ollama."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{settings.ollama_url}/api/tags", timeout=10.0)
            resp.raise_for_status()
        except httpx.ConnectError:
            return []
        data = resp.json()
        return [m["name"] for m in data.get("models", [])]


async def is_reachable() -> bool:
    """Check whether the Ollama server is reachable."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{settings.ollama_url}/api/tags", timeout=5.0)
            return resp.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException):
            return False


async def stream_chat(
    model: str, messages: list[dict], *, timeout: float | None = None
) -> AsyncGenerator[dict, None]:
    """Stream a chat completion from Ollama, yielding event dicts.

    Yields ``{"type": "token", "data": "..."}`` for each token and a final
    ``{"type": "done", "data": "{\"promptTokens\": N, \"completionTokens\": N}"}``
    when the response completes.  On error, yields
    ``{"type": "error", "data": "..."}``.
    """
    request_timeout = timeout or float(settings.stream_timeout_seconds)
    url = f"{settings.ollama_url}/api/chat"
    payload = {"model": model, "messages": messages, "stream": True}

    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                url,
                json=payload,
                timeout=request_timeout,
            ) as resp:
                if resp.status_code == 404:
                    available = await list_models()
                    yield {
                        "type": "error",
                        "data": (
                            f"Model '{model}' not found. Available models: "
                            f"{', '.join(available) if available else 'none'}"
                        ),
                    }
                    return

                resp.raise_for_status()

                prompt_tokens = 0
                completion_tokens = 0

                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    chunk = json.loads(line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield {"type": "token", "data": token}
                    if chunk.get("done"):
                        prompt_tokens = chunk.get("prompt_eval_count", 0) or 0
                        completion_tokens = chunk.get("eval_count", 0) or 0

                yield {
                    "type": "done",
                    "data": json.dumps(
                        {"promptTokens": prompt_tokens, "completionTokens": completion_tokens}
                    ),
                }

    except httpx.ConnectError:
        yield {
            "type": "error",
            "data": "Ollama is not running. Please start Ollama first.",
        }
    except httpx.TimeoutException:
        yield {
            "type": "error",
            "data": "Request timed out. Please try again.",
        }
    except httpx.HTTPStatusError as exc:
        detail = f"Ollama error: {exc.response.status_code}"
        try:
            body = exc.response.json()
            if "error" in body:
                detail = body["error"]
        except Exception:
            pass
        yield {"type": "error", "data": detail}