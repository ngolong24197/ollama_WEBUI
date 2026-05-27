"""Chat orchestration service — streams responses and persists history."""

from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from app.config import settings
from app.database import async_session
from app.models import Conversation, Message
from app.services.ollama import stream_chat
from app.services.search import search

logger = logging.getLogger(__name__)


def _format_search_context(results: list[dict[str, str]]) -> str:
    """Format search results into a context block prepended to the user message."""
    lines: list[str] = ["[Web Search Results]"]
    for idx, r in enumerate(results, start=1):
        lines.append(f"{idx}. {r['title']} ({r['url']})")
        lines.append(f"   {r['snippet']}")
    lines.append("[End of Search Results]")
    return "\n".join(lines)


async def _load_history(conversation_id: int) -> list[dict]:
    """Fetch previous messages for a conversation, ordered by id."""
    from sqlalchemy import select

    async with async_session() as session:
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.id)
        )
        msgs = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in msgs]


async def _save_messages(
    conversation_id: int,
    user_content: str,
    assistant_content: str,
    image_urls: list[str] | None,
    prompt_tokens: int,
    completion_tokens: int,
) -> None:
    """Persist user and assistant messages, then update token count."""
    from sqlalchemy import update

    try:
        async with async_session() as session:
            session.add(
                Message(
                    conversation_id=conversation_id,
                    role="user",
                    content=user_content,
                    image_urls="\n".join(image_urls) if image_urls else None,
                )
            )
            session.add(
                Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_content,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                )
            )
            await session.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(
                    total_tokens=Conversation.total_tokens
                    + prompt_tokens
                    + completion_tokens
                )
            )
            await session.commit()
    except Exception:
        logger.exception("Failed to save messages for conversation %s", conversation_id)


async def _ensure_conversation(
    conversation_id: int | None, model: str, system_prompt: str | None
) -> int:
    """Return an existing conversation id or create a new one."""
    if conversation_id is not None:
        return conversation_id

    async with async_session() as session:
        conv = Conversation(model=model, system_prompt=system_prompt)
        session.add(conv)
        await session.commit()
        await session.refresh(conv)
        return conv.id


async def process_chat(
    message: str,
    model: str,
    conversation_id: int | None = None,
    system_prompt: str | None = None,
    image_urls: list[str] | None = None,
    enable_search: bool = False,
) -> AsyncGenerator[dict, None]:
    """Orchestrate a chat request: search, stream, and persist."""
    # --- optional web search ---
    effective_message = message
    if enable_search:
        try:
            results = await search(message)
            if results:
                context = _format_search_context(results)
                effective_message = f"{context}\n\n{message}"
        except RuntimeError as exc:
            logger.warning("Search failed: %s", exc)

    # --- ensure conversation exists ---
    conversation_id = await _ensure_conversation(conversation_id, model, system_prompt)

    # --- build message list ---
    history = await _load_history(conversation_id) if conversation_id else []
    messages: list[dict] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history)
    user_msg: dict = {"role": "user", "content": effective_message}
    if image_urls:
        user_msg["images"] = image_urls
    messages.append(user_msg)

    # --- stream from Ollama ---
    collected_parts: list[str] = []
    prompt_tokens = 0
    completion_tokens = 0

    try:
        async for event in stream_chat(model, messages):
            if event["type"] == "token":
                collected_parts.append(event["data"])
            elif event["type"] == "done":
                token_info = json.loads(event["data"])
                prompt_tokens = token_info.get("promptTokens", 0)
                completion_tokens = token_info.get("completionTokens", 0)
            yield event
    except Exception as exc:
        logger.exception("Stream error")
        yield {"type": "error", "data": str(exc)}
        return

    # --- persist to database ---
    assistant_content = "".join(collected_parts)
    await _save_messages(
        conversation_id,
        message,
        assistant_content,
        image_urls,
        prompt_tokens,
        completion_tokens,
    )