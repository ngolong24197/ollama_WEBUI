# Ollama Chat UI

A browser-based chat interface for interacting with local Ollama models on Linux. Supports streaming responses, web search augmentation, image input for vision models, system prompt configuration, and persistent conversation history.

## Features

- Stream responses token-by-token from Ollama models
- Model input with validation against locally available models
- Web search toggle (SearXNG) to augment responses with real-time data
- Image attachments for vision-capable models (llava, etc.)
- System prompt per conversation
- Persistent chat history (SQLite)
- Dark mode by default
- Structured response rendering: syntax-highlighted code blocks, formatted JSON, clickable links
- Token counter per message and cumulative in sidebar
- Export conversations as .docx files
- Docker Compose deployment

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start the app + SearXNG
docker-compose up -d

# Access at http://localhost:8000
```

Make sure Ollama is running on the host:

```bash
ollama serve
```

### Option 2: Local Development

```bash
# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev

# Access at http://localhost:5173 (proxies API to :8000)
```

### SearXNG Setup (for web search)

SearXNG is included in the Docker Compose setup. If running locally:

```bash
docker run -d --name searxng -p 8080:8080 searxng/searxng:latest
```

Set `SEARXNG_URL=http://localhost:8080` in your `.env` file.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |
| `SEARXNG_URL` | `http://localhost:8080` | SearXNG URL |
| `DATABASE_URL` | `sqlite+aiosqlite:///data/chat.db` | SQLite database path |
| `MAX_IMAGE_SIZE_MB` | `10` | Max image upload size in MB |
| `STREAM_TIMEOUT_SECONDS` | `300` | Stream timeout in seconds |
| `DEBUG` | `false` | Enable debug mode |

## Tech Stack

- **Backend**: Python + FastAPI
- **Frontend**: React + Vite + TypeScript + shadcn/ui + Tailwind CSS
- **Database**: SQLite via SQLAlchemy
- **LLM Runtime**: Ollama (local HTTP API)
- **Web Search**: SearXNG
- **Streaming**: Server-Sent Events (SSE)
- **Export**: python-docx
- **Containerization**: Docker + Docker Compose

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (Ollama + SearXNG status) |
| POST | `/api/chat` | Stream chat response (SSE) |
| GET | `/api/models` | List available Ollama models |
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations/{id}` | Get conversation |
| PATCH | `/api/conversations/{id}` | Update conversation |
| DELETE | `/api/conversations/{id}` | Delete conversation |
| GET | `/api/conversations/{id}/messages` | Get messages |
| GET | `/api/conversations/{id}/export?format=docx` | Export as .docx |
| GET | `/api/search?q=...` | Search via SearXNG |

## Development

```bash
# Run backend tests
pytest tests/ -v

# Lint backend
ruff check app/

# Lint frontend
cd frontend && npm run lint

# Build frontend
cd frontend && npm run build
```

## License

MIT