from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Migrate: add summary column if it doesn't exist
    async with engine.begin() as conn:
        result = await conn.execute(text(
            "SELECT COUNT(*) FROM pragma_table_info('knowledge_sources') "
            "WHERE name='summary'"
        ))
        if result.scalar() == 0:
            await conn.execute(text(
                "ALTER TABLE knowledge_sources ADD COLUMN summary TEXT"
            ))


async def get_db():
    async with async_session() as session:
        yield session