import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def get_test_category(client: AsyncClient):
    res = await client.get("/api/v1/categories")
    return res.json()[0]

async def test_trends_empty(client: AsyncClient):
    res = await client.get("/api/v1/trends")
    assert res.status_code == 200
    data = res.json()
    assert len(data["per_month_spending"]) == 6
    assert all(m["total"] == 0 for m in data["per_month_spending"])
    assert len(data["category_totals"]) == 0
    assert data["mom_comparison"]["percentage_diff"] == 0.0
    assert data["mom_comparison"]["direction"] == "flat"
    assert data["average_daily_spend"] == 0

async def test_trends_with_data(client: AsyncClient):
    cat = await get_test_category(client)
    cat_id = cat["id"]
    
    # 2026-04 (expense: 1000)
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 1000, "date": "2026-04-10", "category_id": cat_id})
    
    # 2026-05 (expense: 2000)
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 2000, "date": "2026-05-15", "category_id": cat_id})
    
    # 2026-06 (expense: 3000) => +50% over 2000
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 3000, "date": "2026-06-20", "category_id": cat_id})
    
    res = await client.get("/api/v1/trends?month=2026-06&months=3")
    assert res.status_code == 200
    data = res.json()
    
    # 1. per_month_spending
    pms = data["per_month_spending"]
    assert len(pms) == 3
    # Sorted chronologically: 04, 05, 06
    assert pms[0]["month"] == "2026-04"
    assert pms[0]["total"] == 1000
    assert pms[1]["month"] == "2026-05"
    assert pms[1]["total"] == 2000
    assert pms[2]["month"] == "2026-06"
    assert pms[2]["total"] == 3000
    
    # 2. category_totals for 2026-06
    ct = data["category_totals"]
    assert len(ct) == 1
    assert ct[0]["category_name"] == cat["name"]
    assert ct[0]["amount"] == 3000
    assert ct[0]["color"] == cat["color"]
    
    # 3. mom_comparison
    mom = data["mom_comparison"]
    assert mom["percentage_diff"] == 50.0
    assert mom["direction"] == "up"
    
    # 4. avg daily spend (June has 30 days) -> 3000 / 30 = 100
    avg = data["average_daily_spend"]
    assert avg == 100
