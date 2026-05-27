from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Ollama Chat UI"
    debug: bool = False

    ollama_url: str = "http://localhost:11434"
    searxng_url: str = "http://localhost:8080"

    database_url: str = "sqlite+aiosqlite:///data/chat.db"

    max_image_size_mb: int = 10
    stream_timeout_seconds: int = 300

    frontend_dist: str = "frontend/dist"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()