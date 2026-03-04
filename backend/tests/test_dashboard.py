import pytest
from httpx import AsyncClient
import uuid

pytestmark = pytest.mark.asyncio

async def get_test_category(client: AsyncClient):
    res = await client.get("/api/v1/categories")
    return res.json()[0]

async def test_dashboard_empty(client: AsyncClient):
    res = await client.get("/api/v1/dashboard/2026-04")
    assert res.status_code == 200
    data = res.json()
    
    assert data["total_balance"] == 0
    assert data["opening_balance"] == 0
    assert data["total_income"] == 0
    assert data["total_expenses"] == 0
    assert data["net_saved"] == 0
    assert data["unassigned_balance"] == 0
    assert data["salary_added"] is False
    assert len(data["categories"]) == 0
    assert data["overall_limit"]["spent_vs_limit"] == 0
    assert data["overall_limit"]["warning_tier"] is None
    assert data["previous_month_recap"] is None

async def test_dashboard_with_data(client: AsyncClient):
    # Setup settings
    await client.put("/api/v1/settings", json={"opening_balance": 5000, "monthly_spending_limit": 10000})
    
    cat = await get_test_category(client)
    cat_id = cat["id"]
    
    # Add budget
    await client.put(f"/api/v1/budgets/{cat_id}/month/2026-05", json={"budget_limit": 5000})
    
    # Add income
    await client.post("/api/v1/transactions", json={
        "type": "income",
        "amount": 20000,
        "date": "2026-05-01",
        "category_id": None
    })
    
    # Add expense
    await client.post("/api/v1/transactions", json={
        "type": "expense",
        "amount": 2000,
        "date": "2026-05-15",
        "category_id": cat_id
    })
    
    # Add savings goal & allocation
    goal_res = await client.post("/api/v1/savings-goals", json={"name": "Test"})
    goal_id = goal_res.json()["id"]
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 1000, "date": "2026-05-20"})
    
    res = await client.get("/api/v1/dashboard/2026-05")
    assert res.status_code == 200
    data = res.json()
    
    assert data["opening_balance"] == 5000
    # total balance: 5000 + 20000 - 2000 - 1000 = 22000
    assert data["total_balance"] == 22000
    assert data["salary_added"] is True
    assert data["total_income"] == 20000
    assert data["total_expenses"] == 2000
    assert data["net_saved"] == 18000
    # unassigned = net_saved - savings for month (1000) = 17000
    assert data["unassigned_balance"] == 17000
    
    assert len(data["categories"]) == 1
    c = data["categories"][0]
    assert c["category_name"] == cat["name"]
    assert c["spent"] == 2000
    assert c["budget_limit"] == 5000
    assert c["remaining"] == 3000
    assert c["percentage"] == 40
    
    limit = data["overall_limit"]
    assert limit["spent_vs_limit"] == 2000
    assert limit["limit"] == 10000
    assert limit["percentage"] == 20
    assert limit["warning_tier"] is None

async def test_dashboard_recap_and_warnings(client: AsyncClient):
    # settings
    await client.put("/api/v1/settings", json={"opening_balance": 0, "monthly_spending_limit": 1000})
    
    cat = await get_test_category(client)
    cat_id = cat["id"]
    
    # Previous month data (2026-06)
    await client.post("/api/v1/transactions", json={
        "type": "income",
        "amount": 5000,
        "date": "2026-06-01"
    })
    await client.post("/api/v1/transactions", json={
        "type": "expense",
        "amount": 3000, # overspent 1000 limit
        "date": "2026-06-15",
        "category_id": cat_id
    })
    
    # Current month data (2026-07)
    await client.post("/api/v1/transactions", json={
        "type": "expense",
        "amount": 950, # 95% of 1000 limit
        "date": "2026-07-15",
        "category_id": cat_id
    })
    
    res = await client.get("/api/v1/dashboard/2026-07")
    assert res.status_code == 200
    data = res.json()
    
    # check warning tier
    limit = data["overall_limit"]
    assert limit["percentage"] == 95
    assert limit["warning_tier"] == "orange"
    
    # check recap
    recap = data["previous_month_recap"]
    assert recap is not None
    assert recap["total_income"] == 5000
    assert recap["total_spent"] == 3000
    assert recap["net_saved"] == 2000
    assert recap["top_category"]["name"] == cat["name"]
    assert recap["top_category"]["amount"] == 3000
    assert recap["verdict_text"] == "Not bad. You stayed under budget last month." # net_saved > 0
    
    # Let's force negative net_saved for recap to see bad verdict
    await client.post("/api/v1/transactions", json={
        "type": "expense",
        "amount": 3000, # total 6000 expense vs 5000 income = -1000 net_saved in 06
        "date": "2026-06-20",
        "category_id": cat_id
    })
    
    res2 = await client.get("/api/v1/dashboard/2026-07")
    recap2 = res2.json()["previous_month_recap"]
    assert recap2["net_saved"] == -1000
    assert recap2["verdict_text"] == "You overspent last month. Let's do better this time."
