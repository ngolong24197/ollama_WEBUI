# Implementation Plan — Ollama Web UI

## Spec Review: Improvements & Optimizations

### Missing from spec — must add during implementation

1. **`.gitignore`** — Python cache, node_modules, `.env`, `__pycache__`, `dist/`, `.venv/`, SQLite DB file
2. **CORS middleware** — Frontend dev server (port 5173) calls backend (port 8000); need CORS configured for dev, disabled in production (same origin)
3. **Health check endpoint** — `GET /api/health` returns `{ollama: bool, searxng: bool}` so the frontend can show connection status on load
4. **Token count source** — Ollama's `/api/chat` response includes `prompt_eval_count` and `eval_count` fields. Backend must parse these and include them in SSE events so the frontend can display per-message and cumulative counts
5. **SSE event schema** — Need to define the exact SSE event types: `token` (partial text), `done` (completion with token counts), `error` (structured error). Frontend must handle each type
6. **Frontend proxy in dev** — Vite dev server should proxy `/api/*` to FastAPI to avoid CORS issues entirely. This is cleaner than CORS middleware
7. **Conversation deletion** — Spec mentions CRUD for conversations but success criteria only mention listing. Need to clarify: delete, rename?

### Optimizations

1. **Centralized error handler** — Use a FastAPI exception handler middleware that returns consistent `{"error": "type", "detail": "message"}` JSON. No ad-hoc error shapes in individual routers
2. **StreamingResponse with async generator** — The Ollama streaming endpoint should use `StreamingResponse` with an async generator that yields SSE-formatted lines. Don't buffer the full response
3. **Schema splitting** — `schemas.py` will grow past 500 lines with all request/response models. Split into `schemas/chat.py`, `schemas/conversation.py`, etc., and re-export from `schemas/__init__.py`
4. **Frontend API client** — Create a single `api.ts` that handles all fetch calls, error wrapping, and SSE parsing. No raw `fetch()` calls scattered in hooks
5. **Image size limit** — Enforce a max image size (e.g., 10MB) on both frontend (preview rejection) and backend (payload validation). Ollama has limits too
6. **Auto-scroll behavior** — ChatView must auto-scroll on new tokens, but only if the user hasn't manually scrolled up. Track scroll position with a threshold

---

## Dependency Graph

```
Phase 1: Scaffolding
    │
    ▼
Phase 2: Backend core (Ollama client, chat endpoint, conversations CRUD)
    │
    ├──▶ Phase 3: Frontend chat UI (streaming, markdown, dark mode)
    │       │
    │       ▼
    │   Phase 4: Sidebar + settings (conversations, model input, system prompt)
    │       │
    │       ├──▶ Phase 5: Search + Images (SearXNG, image attach)
    │       │       │
    │       │       ▼
    │       │   Phase 6: Export + Docker (docx, Dockerfile, compose)
    │       │
    │       └──▶ Phase 7: Polish (error handling pass, token counter, health check)
```

Phase 5 and the error-handling polish can partially overlap with Phase 4, but the vertical path above is the safest order.

---

## Phase Breakdown

### Phase 1: Project Scaffolding
**Branch:** `feature/project-setup`
**Goal:** Bootable backend + frontend skeleton + Docker files

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 1.1 | Create Python project structure (`app/`, `tests/`, `requirements.txt`) | `pip install -r requirements.txt` succeeds | Run install |
| 1.2 | Create FastAPI app with health check, CORS, static files mount | `GET /api/health` returns `{status: "ok"}` | `curl localhost:8000/api/health` |
| 1.3 | Initialize React + Vite project with shadcn/ui + Tailwind + TypeScript strict | `npm run dev` shows a placeholder page | Open browser |
| 1.4 | Configure Vite proxy (`/api/*` → `localhost:8000`) | Frontend dev server proxies API calls | Check Vite config |
| 1.5 | Create `.gitignore`, `.env.example`, `.dockerignore` | Files exist with correct entries | Read files |
| 1.6 | Create Dockerfile (multi-stage) + docker-compose.yml | `docker-compose up -d --build` starts both containers | `curl localhost:8000/api/health` |

### Phase 2: Backend Core
**Branch:** `feature/backend-api`
**Goal:** Ollama streaming works end-to-end, conversations persist in SQLite

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 2.1 | SQLAlchemy models (`Conversation`, `Message`) + DB init | Tables created on startup, migrations work | `sqlite3 data/chat.db .tables` |
| 2.2 | Ollama service: list models, stream chat, health check | Can list models, can send a message and get streaming response | Unit tests |
| 2.3 | Chat router: `POST /api/chat` with SSE streaming | `curl` receives SSE stream with `token`, `done`, `error` events | Manual curl + tests |
| 2.4 | Conversations router: CRUD endpoints | Create, list, get, delete conversations via API | pytest |
| 2.5 | Centralized error handler middleware | All errors return `{"error": "type", "detail": "message"}` | Test with bad requests |
| 2.6 | Schema module split (chat, conversation, models) | Each schema file under 200 lines, re-exported from `__init__.py` | Line count check |

### Phase 3: Frontend Chat UI
**Branch:** `feature/chat-ui`
**Goal:** Can type a message, see it stream back, rendered with markdown

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 3.1 | `api.ts` — centralized API client with SSE parsing and error wrapping | All API calls go through this module | No raw `fetch()` elsewhere |
| 3.2 | Types module — `Message`, `Conversation`, `ChatRequest`, etc. | TypeScript strict mode compiles | `npm run build` passes |
| 3.3 | `ThemeProvider` + dark mode default | App renders in dark mode on first load | Visual check |
| 3.4 | `MarkdownRenderer` + `CodeBlock` + `JsonBlock` | Code blocks have syntax highlighting, JSON is formatted, links are clickable | Manual test |
| 3.5 | `useChat` hook — SSE streaming with partial message assembly | Hook returns `{messages, sendMessage, isStreaming, error}` | Test with mock SSE |
| 3.6 | `ChatView` + `ChatMessage` + `StreamingCursor` | Messages render, auto-scroll works, streaming cursor visible | Manual test |
| 3.7 | `ChatInput` — text input, send button, Enter to send | Can type and submit a message | Manual test |

### Phase 4: Sidebar + Settings
**Branch:** `feature/sidebar-conversations`
**Goal:** Full conversation management with model input and system prompt

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 4.1 | `useConversations` hook — list, create, delete, switch | Hook manages conversation state | Test |
| 4.2 | `Sidebar` + `ConversationItem` + `SessionTokenCount` | Sidebar lists conversations with token totals | Manual test |
| 4.3 | `ModelInput` — type model name, validate against `/api/models` | Invalid model shows error, valid model accepted | Manual test |
| 4.4 | `SystemPrompt` — textarea to set system prompt per conversation | System prompt persists for the conversation | Manual test |
| 4.5 | Error states — Ollama down banner, model not found, search unavailable | Each error shows a clear human message | Manual test |

### Phase 5: Search + Images
**Branch:** `feature/search-and-images`
**Goal:** SearXNG search augmentation and image attachments work

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 5.1 | SearXNG service backend — search endpoint, error handling | `GET /api/search?q=...` returns results or graceful error | curl + tests |
| 5.2 | `SearchToggle` + `useSearch` hook | Toggle enables search for next message, results injected into prompt | Manual test |
| 5.3 | `ImageAttach` — upload, preview, base64 encode, size validation | Image appears as preview, rejected if >10MB or wrong format | Manual test |
| 5.4 | Image in chat payload — send as base64 in Ollama format | Vision model receives and processes the image | Manual test with llava |
| 5.5 | Search results formatting in prompt | Search results are clearly delineated in the context sent to Ollama | Read API payload |

### Phase 6: Export + Docker Polish
**Branch:** `feature/export-and-docker`
**Goal:** Export to .docx, Docker Compose works reliably

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 6.1 | Export router — `GET /api/conversations/{id}/export?format=docx` | Returns a downloadable .docx file | curl + open in LibreOffice |
| 6.2 | .docx formatting — messages styled as conversation, code blocks preserved | Export looks good in Word/LibreOffice | Visual check |
| 6.3 | Dockerfile refinement — slim image, non-root user, health check | Image < 500MB, health check works | `docker inspect` |
| 6.4 | docker-compose polish — SearXNG config, volume mounts, env vars | `docker-compose up -d` → both services healthy | `docker-compose ps` |
| 6.5 | README with setup instructions (SearXNG Docker, env vars, first run) | A new user can follow README to get running | Read-through |

### Phase 7: Polish + Token Counter + Error Pass
**Branch:** `feature/polish`
**Goal:** All error paths covered, token counters working, no rough edges

| # | Task | Acceptance | Verify |
|---|------|-----------|--------|
| 7.1 | `TokenCounter` per message — shows prompt + completion tokens | Each message shows token count after streaming completes | Visual check |
| 7.2 | `SessionTokenCount` in sidebar — cumulative total | Sidebar item shows total tokens for the session | Visual check |
| 7.3 | Error handling audit — every error path returns user-friendly message | No raw error objects visible to user | Try: Ollama off, bad model, no SearXNG, timeout |
| 7.4 | SSE reconnect / retry logic | If stream drops, user sees notice and can retry | Kill Ollama mid-stream |
| 7.5 | Loading states — skeleton placeholders, disabled states during requests | No flickering, no unresponsive buttons | Visual check |
| 7.6 | Final review — all files under 500 lines, no duplication, clean imports | `find . -name "*.py" -o -name "*.tsx" | xargs wc -l` max < 500 | Script check |

---

## Checkpoint Between Phases

After each phase:
1. Push branch to remote
2. Open PR to `main`
3. User reviews and merges
4. Start next phase from updated `main`

No phase starts until the previous PR is merged.