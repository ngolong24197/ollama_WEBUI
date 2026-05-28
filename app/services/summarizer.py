"""Summarization service — generates document summaries via Ollama.

For short documents, generates a single summary. For long documents that
exceed the model's context window, uses hierarchical summarization:
chunk the document, summarize each chunk, then combine chunk summaries.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_SUMMARY_SYSTEM_PROMPT = (
    "You are a document analyst. Write a comprehensive analytical summary of the "
    "following document. Cover its purpose, key findings, notable data points, "
    "conclusions, and main topics. Write in clear prose, approximately 300-500 words. "
    "Do not list bullet points; write continuous analytical prose."
)

_COMBINE_SYSTEM_PROMPT = (
    "You are a document analyst. The following are summaries of different sections "
    "of a single document. Combine them into one coherent analytical summary. "
    "Cover the document's purpose, key findings, notable data points, conclusions, "
    "and main topics. Write in clear prose, approximately 300-500 words. "
    "Do not list bullet points; write continuous analytical prose."
)

# Rough character limit for a single summarization call.
# ~4 chars per token, leave room for system prompt + output.
_MAX_SINGLE_SUMMARY_CHARS = 24000  # ~6000 tokens


async def _call_llm(system_prompt: str, user_content: str, model: str, timeout: float = 120.0) -> str | None:
    """Call the Ollama chat API (non-streaming) and return the response content."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.ollama_url}/api/chat",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    "stream": False,
                },
                timeout=timeout,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "").strip()
            if not content:
                logger.warning("LLM returned empty content.")
                return None
            return content
    except Exception:
        logger.exception("LLM call failed.")
        return None


def _split_into_sections(text: str, max_chars: int) -> list[str]:
    """Split text into sections that each fit within max_chars.

    Prefers splitting at paragraph boundaries. Falls back to sentence
    boundaries, then to hard splits.
    """
    if len(text) <= max_chars:
        return [text]

    sections: list[str] = []
    remaining = text

    while remaining:
        if len(remaining) <= max_chars:
            sections.append(remaining)
            break

        # Find the best split point within max_chars
        chunk = remaining[:max_chars]

        # Try paragraph boundary
        para_break = chunk.rfind("\n\n")
        if para_break > max_chars // 4:
            sections.append(remaining[:para_break])
            remaining = remaining[para_break:].lstrip("\n")
            continue

        # Try newline
        line_break = chunk.rfind("\n")
        if line_break > max_chars // 4:
            sections.append(remaining[:line_break])
            remaining = remaining[line_break:].lstrip("\n")
            continue

        # Try sentence boundary
        for sep in [". ", "! ", "? "]:
            sent_break = chunk.rfind(sep)
            if sent_break > max_chars // 4:
                sections.append(remaining[:sent_break + len(sep)])
                remaining = remaining[sent_break + len(sep):]
                break
        else:
            # Hard split
            sections.append(chunk)
            remaining = remaining[max_chars:]

    return sections


async def generate_summary(text: str, model: str | None = None) -> str | None:
    """Generate a summary of the document text using the LLM.

    For documents that fit within the context window, generates a single
    summary. For longer documents, uses hierarchical summarization:
    summarize each section, then combine the section summaries.

    Returns the summary string, or None if summarization fails.
    """
    chat_model = model or settings.default_chat_model
    if not chat_model:
        logger.warning("No chat model configured for summarization; skipping summary.")
        return None

    if not text.strip():
        return None

    # Short document — single-pass summarization
    if len(text) <= _MAX_SINGLE_SUMMARY_CHARS:
        return await _call_llm(
            _SUMMARY_SYSTEM_PROMPT,
            f"Summarize the following document:\n\n{text}",
            chat_model,
        )

    # Long document — hierarchical summarization
    logger.info(
        "Document is %d chars (exceeds %d); using hierarchical summarization.",
        len(text), _MAX_SINGLE_SUMMARY_CHARS,
    )

    sections = _split_into_sections(text, _MAX_SINGLE_SUMMARY_CHARS)
    logger.info("Split document into %d sections for summarization.", len(sections))

    # Summarize each section
    section_summaries: list[str] = []
    for i, section in enumerate(sections):
        summary = await _call_llm(
            _SUMMARY_SYSTEM_PROMPT,
            f"Summarize this section (part {i + 1} of {len(sections)}):\n\n{section}",
            chat_model,
        )
        if summary:
            section_summaries.append(summary)

    if not section_summaries:
        logger.warning("All section summarizations failed; no summary available.")
        return None

    # If only one section succeeded, use it directly
    if len(section_summaries) == 1:
        return section_summaries[0]

    # Combine section summaries into a final summary
    combined_text = "\n\n".join(
        f"--- Section {i + 1} ---\n{s}"
        for i, s in enumerate(section_summaries)
    )

    return await _call_llm(
        _COMBINE_SYSTEM_PROMPT,
        f"Combine these section summaries into one coherent summary:\n\n{combined_text}",
        chat_model,
    )