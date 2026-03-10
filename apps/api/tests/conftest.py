"""Shared pytest fixtures for API tests."""
import sys
import os
import pytest

# Ensure packages/ is importable
_PACKAGES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packages"))
_API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in [_PACKAGES_DIR, _API_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from fastapi.testclient import TestClient

TEST_DB_URL = "sqlite+aiosqlite:///./test_api.db"

_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
_AsyncSessionLocal = async_sessionmaker(_engine, expire_on_commit=False)


async def _init_db():
    from database import Base
    import models  # noqa: register all models
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def _override_get_db():
    async with _AsyncSessionLocal() as session:
        yield session


@pytest.fixture(scope="function")
def client():
    import asyncio
    asyncio.get_event_loop().run_until_complete(_init_db())

    from main import app
    from database import get_db
    app.dependency_overrides[get_db] = _override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


# Expose the session maker for tests that need direct DB access
AsyncSessionLocal = _AsyncSessionLocal
