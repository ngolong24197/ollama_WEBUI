from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import chat, conversations, models, search, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "detail": str(exc)},
    )


app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(models.router)
app.include_router(search.router)
app.include_router(export.router)


@app.get("/api/health")
async def health_check():
    from app.services.ollama import is_reachable

    ollama_ok = await is_reachable()
    searxng_ok = False
    try:
        from app.services.search import search as search_web
        await search_web("test")
        searxng_ok = True
    except Exception:
        pass
    return {"status": "ok", "ollama": ollama_ok, "searxng": searxng_ok}


frontend_dist = Path(settings.frontend_dist)
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")