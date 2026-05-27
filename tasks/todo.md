# Todo — Ollama Web UI Implementation

- [ ] Phase 1: Project scaffolding (branch: `feature/project-setup`)
  - [ ] 1.1 Python project structure + requirements.txt
  - [ ] 1.2 FastAPI app with health check, CORS, static files mount
  - [ ] 1.3 React + Vite + shadcn/ui + Tailwind + TypeScript
  - [ ] 1.4 Vite proxy config for `/api/*`
  - [ ] 1.5 `.gitignore`, `.env.example`, `.dockerignore`
  - [ ] 1.6 Dockerfile + docker-compose.yml

- [ ] Phase 2: Backend core (branch: `feature/backend-api`)
  - [ ] 2.1 SQLAlchemy models (Conversation, Message) + DB init
  - [ ] 2.2 Ollama service (list models, stream chat, health check)
  - [ ] 2.3 Chat router with SSE streaming (token/done/error events)
  - [ ] 2.4 Conversations router (CRUD)
  - [ ] 2.5 Centralized error handler middleware
  - [ ] 2.6 Schema module split

- [ ] Phase 3: Frontend chat UI (branch: `feature/chat-ui`)
  - [ ] 3.1 Centralized `api.ts` with SSE parsing
  - [ ] 3.2 TypeScript types module
  - [ ] 3.3 ThemeProvider + dark mode default
  - [ ] 3.4 MarkdownRenderer + CodeBlock + JsonBlock
  - [ ] 3.5 useChat hook (SSE streaming, partial assembly)
  - [ ] 3.6 ChatView + ChatMessage + StreamingCursor
  - [ ] 3.7 ChatInput (text + send)

- [ ] Phase 4: Sidebar + settings (branch: `feature/sidebar-conversations`)
  - [ ] 4.1 useConversations hook
  - [ ] 4.2 Sidebar + ConversationItem + SessionTokenCount
  - [ ] 4.3 ModelInput (validate against /api/models)
  - [ ] 4.4 SystemPrompt per conversation
  - [ ] 4.5 Error states (Ollama down, model not found, search unavailable)

- [ ] Phase 5: Search + Images (branch: `feature/search-and-images`)
  - [ ] 5.1 SearXNG service + search endpoint
  - [ ] 5.2 SearchToggle + useSearch hook
  - [ ] 5.3 ImageAttach (upload, preview, base64, size validation)
  - [ ] 5.4 Image in Ollama chat payload
  - [ ] 5.5 Search results formatting in prompt

- [ ] Phase 6: Export + Docker (branch: `feature/export-and-docker`)
  - [ ] 6.1 Export router (.docx endpoint)
  - [ ] 6.2 .docx formatting (conversation style, code blocks)
  - [ ] 6.3 Dockerfile refinement (slim, non-root, health check)
  - [ ] 6.4 docker-compose polish (SearXNG config, volumes, env)
  - [ ] 6.5 README setup instructions

- [ ] Phase 7: Polish (branch: `feature/polish`)
  - [ ] 7.1 TokenCounter per message
  - [ ] 7.2 SessionTokenCount in sidebar
  - [ ] 7.3 Error handling audit (every path user-friendly)
  - [ ] 7.4 SSE reconnect/retry logic
  - [ ] 7.5 Loading states (skeletons, disabled buttons)
  - [ ] 7.6 Final review (file sizes, no duplication)