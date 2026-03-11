from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from config import settings

_url = settings.database_url

# Normalise to async driver
if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _url.startswith("sqlite://"):
    _url = _url.replace("sqlite://", "sqlite+aiosqlite://", 1)

_connect_args = {"check_same_thread": False} if "sqlite" in _url else {}

engine = create_async_engine(_url, echo=False, connect_args=_connect_args)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
