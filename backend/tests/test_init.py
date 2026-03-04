import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_init_success(client: AsyncClient):
    res = await client.post("/api/v1/init")
    assert res.status_code == 200
    assert res.json() == {"detail": "System initialized successfully."}

    # Verify categories were created
    cat_res = await client.get("/api/v1/categories")
    categories = cat_res.json()
    assert len(categories) == 10
    
    # Verify app settings were created
    settings_res = await client.get("/api/v1/settings")
    assert settings_res.status_code == 200
    settings = settings_res.json()
    assert "opening_balance" in settings
    assert "monthly_spending_limit" in settings

async def test_init_is_idempotent(client: AsyncClient):
    # First init
    await client.post("/api/v1/init")
    
    # Modify settings to test it doesn't overwrite
    await client.put("/api/v1/settings", json={"opening_balance": 500, "monthly_spending_limit": 1000})

    # Second init
    res2 = await client.post("/api/v1/init")
    assert res2.status_code == 200

    # Ensure categories are exactly 10, not duplicated
    cat_res = await client.get("/api/v1/categories")
    categories = cat_res.json()
    assert len(categories) == 10

    # Ensure settings were ignored (or not overwritten) during the second init
    settings_res = await client.get("/api/v1/settings")
    settings = settings_res.json()
    assert settings["opening_balance"] == 500
    assert settings["monthly_spending_limit"] == 1000

async def test_reset_data(client: AsyncClient):
    # Initialize system first
    await client.post("/api/v1/init")
    
    # Create a category to test
    cat_res = await client.post("/api/v1/categories", json={"name": "TestCat", "icon": "🔥", "color": "#000000"})
    cat_id = cat_res.json()["id"]
    
    # Create fake transaction
    await client.post("/api/v1/transactions", json={
        "type": "expense",
        "amount": 500,
        "date": "2026-03-01",
        "category_id": cat_id
    })
    
    # Reset
    res = await client.post("/api/v1/reset")
    assert res.status_code == 200
    assert res.json() == {"detail": "All data reset successfully."}
    
    # Ensure Transactions is empty
    transactions = await client.get("/api/v1/transactions")
    assert len(transactions.json()) == 0
    
    # Ensure Categories still exist
    categories = await client.get("/api/v1/categories")
    assert len(categories.json()) >= 10
    
    # Ensure App Settings zeroed
    settings = await client.get("/api/v1/settings")
    assert settings.json()["opening_balance"] == 0
    assert settings.json()["monthly_spending_limit"] == 0
