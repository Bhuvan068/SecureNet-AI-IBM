from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

# Backward compatibility for older files
async_session_maker = AsyncSessionLocal


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Create all database tables if they don't already exist."""
    async with engine.begin() as conn:
        from app import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        
        # Ensure conversation_id exists in chat_messages table (migration for existing DBs)
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN conversation_id VARCHAR;"))
        except Exception:
            pass
