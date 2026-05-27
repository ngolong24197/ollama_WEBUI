# Spec: Chat UI — Web Interface for Ollama on Linux

## Objective

A browser-based chat interface for interacting with local Ollama models on Linux (Pop!_OS). Since Linux lacks a dedicated GUI app like the Windows Ollama client, this fills that gap with a self-hosted web UI that supports streaming responses, web search augmentation, image input for vision models, system prompt configuration, and persistent conversation history.

**Target user:** A developer or power user running Ollama locally on Linux who wants a polished, feature-rich chat interface without relying on a terminal.

**Success criteria:**
- User can type a model name, send messages, and see responses stream in token-by-token
- Web search can be toggled on/off per message to augment responses with real-time data
- Images can be attached to messages for vision-capable models
- System prompt is configurable per conversation
- Chat history persists across browser sessions in SQLite
- The app runs as a single process accessible at `localhost:8000`

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Backend | Python + FastAPI | Python 3.11+, FastAPI 0.115+ |
| Frontend | React + Vite | React 19, Vite 6 |
| UI Components | shadcn/ui + Tailwind CSS | Tailwind 4, shadcn/ui latest |
| Database | SQLite via SQLAlchemy | SQLAlchemy 2+ |
| LLM Runtime | Ollama (local HTTP API) | 0.24+ |
| Web Search | SearXNG (self-hosted) | Latest |
| Streaming | Server-Sent Events (SSE) | — |
| Response Rendering | react-markdown + rehype-highlight | — |
| Export | python-docx | Latest |
| Containerization | Docker + Docker Compose | Latest |
| Reverse Proxy | FastAPI serves built frontend | — |

## Commands

```bash
# === Development (local) ===

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# Run backend dev server (with hot reload)
uvicorn app.main:app --reload --port 8000

# Run frontend dev server (with hot reload)
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Run linting (backend)
ruff check app/

# Run linting (frontend)
cd frontend && npm run lint

# Run backend tests
pytest tests/ -v

# Run frontend tests
cd frontend && npm run test
```

```bash
# === Docker (production) ===

# Start everything (app + SearXNG)
docker-compose up -d

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f chat-ui
```

## Project Structure

```
Chat_UI/
├── app/                        # Python backend
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings (env vars, defaults)
│   ├── models.py               # SQLAlchemy models
│   ├── database.py             # DB session, engine, init
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── chat.py             # Chat endpoints (send message, stream)
│   │   ├── conversations.py    # CRUD for conversations
│   │   ├── models.py           # List/validate local Ollama models
│   │   ├── search.py           # SearXNG proxy endpoint
│   │   └── export.py           # Export conversation as .docx
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ollama.py           # Ollama API client (streaming)
│   │   ├── search.py           # SearXNG search client
│   │   └── chat.py             # Chat logic (orchestration)
│   └── schemas.py              # Pydantic request/response models
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # Entry point
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── chat/
│   │   │   │   ├── ChatMessage.tsx  # Single message bubble
│   │   │   │   ├── ChatInput.tsx    # Input bar (text + attachments)
│   │   │   │   ├── ChatView.tsx     # Message list + scroll
│   │   │   │   ├── StreamingCursor.tsx # Animated streaming indicator
│   │   │   │   └── TokenCounter.tsx # Token usage per conversation
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.tsx      # Conversation list
│   │   │   │   └── ConversationItem.tsx # Single conversation row
│   │   │   ├── settings/
│   │   │   │   ├── ModelInput.tsx    # Model name input
│   │   │   │   ├── SystemPrompt.tsx  # System prompt editor
│   │   │   │   └── SearchToggle.tsx # Web search on/off toggle
│   │   │   ├── attachments/
│   │   │   │   └── ImageAttach.tsx   # Image upload/preview
│   │   │   └── shared/
│   │   │       ├── MarkdownRenderer.tsx # Structured response rendering
│   │   │       ├── CodeBlock.tsx     # Syntax-highlighted code blocks
│   │   │       ├── JsonBlock.tsx     # Formatted collapsible JSON
│   │   │       └── ThemeProvider.tsx  # Dark mode provider
│   │   ├── hooks/
│   │   │   ├── useChat.ts      # Chat streaming hook
│   │   │   ├── useConversations.ts
│   │   │   └── useSearch.ts
│   │   ├── lib/
│   │   │   ├── api.ts          # API client functions
│   │   │   └── utils.ts        # Shared utilities
│   │   └── types/
│   │       └── index.ts        # TypeScript type definitions
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── tests/                       # Backend tests
│   ├── conftest.py
│   ├── test_chat.py
│   ├── test_conversations.py
│   └── test_search.py
├── Dockerfile                   # Multi-stage: build frontend, run backend + serve static
├── docker-compose.yml           # App + SearXNG services
├── .dockerignore
├── .env.example                 # Environment variable template
├── SPEC.md                      # This file
├── requirements.txt
└── README.md
```

## Code Style

### Backend (Python)

```python
# FastAPI router — clean, typed, minimal logic in route handlers
from fastapi import APIRouter, Depends
from app.schemas import ChatRequest, ChatResponse
from app.services.chat import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    chat_service: ChatService = Depends(),
):
    """Send a message and receive a streamed response."""
    return chat_service.process(request)
```

- Use `ruff` for linting and formatting
- Type hints on all function signatures
- Pydantic models for all request/response schemas
- Dependency injection via FastAPI `Depends`
- Async everywhere for I/O-bound operations

### Frontend (TypeScript/React)

```tsx
// Component — co-located styles via Tailwind, typed props
import { Message } from "@/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  return (
    <div className={cn("flex gap-3 p-4", message.role === "user" && "justify-end")}>
      <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isStreaming && <span className="animate-pulse">|</span>}
      </div>
    </div>
  );
}
```

- Functional components with hooks only
- TypeScript strict mode
- Tailwind utility classes — no separate CSS files
- shadcn/ui components for all interactive elements
- Custom hooks for data fetching (`useChat`, `useConversations`)

## Testing Strategy

| Level | Framework | Location | Scope |
|-------|-----------|----------|-------|
| Backend unit | pytest | `tests/` | Services, schemas, utilities |
| Backend integration | pytest + httpx | `tests/` | API endpoints against test DB |
| Frontend unit | Vitest | `frontend/src/` | Hooks, utilities |
| Frontend component | Vitest + Testing Library | `frontend/src/` | Component rendering, interactions |
| E2E | Playwright | `e2e/` (future) | Critical user flows |

**Coverage expectation:** Backend 80%+, frontend component coverage for core flows.

**Test commands:**
```bash
pytest tests/ -v --cov=app --cov-report=term-missing
cd frontend && npm run test -- --coverage
```

## Boundaries

### Always do
- Run backend tests before committing
- Use Pydantic schemas for all API input/output — never pass raw dicts
- Stream responses via SSE — never block on full response
- Handle Ollama connection errors gracefully (show user-friendly message)
- Validate model names against Ollama's local model list before sending
- Store images as base64 in the message payload (Ollama expects this)
- Keep every file under 500 lines — split into smaller modules if approaching limit
- Extract shared UI patterns into reusable components — no copy-paste duplication
- Render model responses as structured content: code blocks with syntax highlighting, JSON formatted, links clickable
- Default to dark mode
- Provide SearXNG Docker setup instructions in README
- FastAPI serves the built frontend as static files — single container, no separate nginx
- Docker Compose starts everything with one command
- **Error handling and fallbacks for every external call:**
  - Ollama unreachable → show "Ollama is not running" with setup hint, don't crash
  - Model not found → show available models list, let user pick or retype
  - SearXNG unreachable → disable search toggle with tooltip explaining why, proceed without search
  - SearXNG returns no results → inform user "no results found", continue conversation normally
  - Image too large or unsupported format → show error inline, don't silently drop it
  - Network timeout → retry once with backoff, then show error message
  - SSE stream interrupted → show partial response + "stream ended unexpectedly" notice, allow retry
  - SQLite write failure → log error, show "couldn't save message" notice, don't lose the displayed message
  - Every API endpoint returns structured error JSON with `{"error": "type", "detail": "message"}`
  - Frontend never shows raw error objects to the user — always wrap in human-readable messages

### Ask first
- Adding new npm/pip dependencies
- Changing the database schema (migration strategy)
- Modifying the API contract between frontend and backend
- Adding authentication or multi-user support
- Changing the SearXNG integration approach

### Never do
- Commit `.env` files or secrets
- Shell out to `ollama run` — always use the HTTP API
- Store raw image files on disk — keep them in the request/response payload
- Block the UI thread — all network calls must be async
- Hardcode Ollama/SearXNG URLs — make them configurable

## Success Criteria

1. **Chat works end-to-end**: Type a message → see it stream back from Ollama, token by token
2. **Model input works**: Type any model name → app validates it exists locally → sends to that model
3. **Web search toggle**: Flip a switch → next message includes SearXNG results in context → model uses them
4. **Image input**: Attach an image → it's sent as base64 → vision model processes it
5. **System prompt**: Set a system prompt → it persists for the conversation
6. **Chat history**: Close browser → reopen → past conversations are listed in sidebar
7. **Error handling**: Ollama not running → clear error message. Model not found → clear error message
8. **Dark mode**: App defaults to dark mode on first load
9. **Structured rendering**: Code renders in syntax-highlighted blocks, JSON is formatted, links are clickable
10. **Export**: Can download a conversation as a `.docx` file with proper formatting
11. **No file over 500 lines**: All files stay under 500 lines; shared components reused across the app
12. **Docker**: `docker-compose up -d` starts the app + SearXNG; app is accessible at `localhost:8000`; works across laptop restarts
13. **Token counter**: Each conversation shows a running token count (prompt tokens + completion tokens), updating live during streaming

## Resolved Questions

1. **SearXNG**: User doesn't have it yet — document Docker-based setup in README and provide config defaults pointing to `localhost:8080`
2. **Dark mode**: Default to dark mode
3. **Response rendering**: Render responses in structured, human-readable format — code in code blocks with syntax highlighting, JSON formatted and collapsible, tables rendered as tables, links clickable, lists properly styled
4. **Export**: Export conversations as `.docx` (Word) files

## Architecture Rules

- **No file over 500 lines** — if a file approaches this, split into smaller focused modules
- **Reusable components** — extract shared UI patterns into components in `components/ui/` or `components/shared/`; no copy-paste duplication
- **Composition over duplication** — if similar UI appears in 2+ places, make it a shared component or hook
- **Single responsibility** — each file does one thing; each component renders one concern

## Git Workflow

- **Remote**: `https://github.com/ngolong24197/ollama_WEBUI`
- **Branching**: Each feature/phase gets its own branch (`feature/<name>`)
- **PRs**: Push branch → open PR → user reviews → merge to `main`
- **Never push directly to `main`** — always go through a PR

## Docker Architecture

The app runs as a single Docker container (FastAPI serves the built React frontend as static files). SearXNG runs as a separate container. Ollama runs on the host machine (not containerized — users manage it separately).

```yaml
# docker-compose.yml — conceptual overview
services:
  chat-ui:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_URL=http://host.docker.internal:11434
      - SEARXNG_URL=http://searxng:8080
    volumes:
      - chat_data:/app/data    # SQLite DB persistence
    restart: unless-stopped     # Auto-start on boot

  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    volumes:
      - searxng_data:/etc/searxng
    restart: unless-stopped

volumes:
  chat_data:
  searxng_data:
```

**Key design decisions:**
- **Single container** for the app — FastAPI serves both the API (`/api/*`) and the built frontend (`/`) from the same port. No separate nginx container needed.
- **Ollama on host** — Ollama runs natively on the host (not in Docker) because it manages GPU access and model storage. The container connects via `host.docker.internal:11434`.
- **SearXNG in Docker** — SearXNG is containerized alongside the app for easy setup.
- **Named volumes** — SQLite database persists in a Docker volume so chat history survives container rebuilds.
- **`restart: unless-stopped`** — containers auto-start when the laptop boots, matching the "access anytime" requirement.
- **Multi-stage Dockerfile** — Stage 1 builds the React frontend, Stage 2 runs the Python backend with the built frontend copied in.