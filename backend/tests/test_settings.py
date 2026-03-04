import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.domain import AppSettings

pytestmark = pytest.mark.asyncio

async def test_get_settings(client: AsyncClient):
    response = await client.get("/api/v1/settings")
    assert response.status_code == 200
    data = response.json()
    assert "opening_balance" in data
    assert "monthly_spending_limit" in data
    assert "created_at" in data
    assert "updated_at" in data

async def test_update_settings(client: AsyncClient):
    update_data = {
        "opening_balance": 1000000,  # 10k INR
        "monthly_spending_limit": 500000  # 5k INR
    }
    
    response = await client.put("/api/v1/settings", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["opening_balance"] == 1000000
    assert data["monthly_spending_limit"] == 500000
    
    # Verify it persisted by fetching again
    get_res = await client.get("/api/v1/settings")
    assert get_res.json()["opening_balance"] == 1000000
