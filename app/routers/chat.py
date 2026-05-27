import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def stream_chat(request: ChatRequest, req: Request):
    """Stream a chat response from Ollama via SSE."""
    from app.services.chat import process_chat

    async def event_generator():
        try:
            async for event in process_chat(
                message=request.message,
                model=request.model,
                conversation_id=request.conversation_id,
                system_prompt=request.system_prompt,
                image_urls=request.image_urls,
                enable_search=request.enable_search,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'data': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )