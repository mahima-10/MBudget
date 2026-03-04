import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.seed import seed_data

# Use the same default database URL for tests
DATABASE_URL = settings.database_url

engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
TestingSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Ensure database has schema and seed data once for the test session."""
    # We assume schema is already created by Alembic 
    # and seed data is populated. We'll just run seed_data to be safe.
    await seed_data()
    yield

@pytest_asyncio.fixture
async def db_session():
    """Provides a transactional scope around a series of operations."""
    connection = await engine.connect()
    transaction = await connection.begin()
    
    session = TestingSessionLocal(bind=connection)
    
    # Prevent app from actually committing the test-level transaction
    # We flush instead to get DB-generated fields like IDs
    async def mock_commit():
        await session.flush()
    
    session.commit = mock_commit
    
    yield session
    
    await session.close()
    await transaction.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """Provides a test client that uses the transactional db_session."""
    
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
        
    app.dependency_overrides.clear()
