import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def get_category_id(client: AsyncClient):
    res = await client.get("/api/v1/categories")
    return res.json()[0]["id"]

async def test_get_budgets_missing_month(client: AsyncClient):
    res = await client.get("/api/v1/budgets")
    assert res.status_code == 422

async def test_put_budget_insert_and_get(client: AsyncClient):
    cat_id = await get_category_id(client)
    month = "2026-03"
    
    # insert
    put_res = await client.put(f"/api/v1/budgets/{cat_id}/month/{month}", json={"budget_limit": 1000})
    assert put_res.status_code == 200
    assert put_res.json()["budget_limit"] == 1000
    
    # get
    get_res = await client.get(f"/api/v1/budgets?month={month}")
    assert get_res.status_code == 200
    assert len(get_res.json()) >= 1
    
    budget = next((b for b in get_res.json() if b["category_id"] == cat_id), None)
    assert budget is not None
    assert budget["budget_limit"] == 1000

async def test_put_budget_update(client: AsyncClient):
    cat_id = await get_category_id(client)
    month = "2026-04"
    
    await client.put(f"/api/v1/budgets/{cat_id}/month/{month}", json={"budget_limit": 1000})
    
    update_res = await client.put(f"/api/v1/budgets/{cat_id}/month/{month}", json={"budget_limit": 2000})
    assert update_res.status_code == 200
    assert update_res.json()["budget_limit"] == 2000
    
    get_res = await client.get(f"/api/v1/budgets?month={month}")
    budget = next((b for b in get_res.json() if b["category_id"] == cat_id), None)
    assert budget is not None
    assert budget["budget_limit"] == 2000

async def test_post_bulk_budgets(client: AsyncClient):
    res = await client.get("/api/v1/categories")
    cats = res.json()
    cat1 = cats[0]["id"]
    cat2 = cats[1]["id"]
    month = "2026-05"
    
    # create one first to test update path in bulk
    await client.put(f"/api/v1/budgets/{cat1}/month/{month}", json={"budget_limit": 500})
    
    bulk_data = [
        {"category_id": cat1, "month": month, "budget_limit": 1500}, # update
        {"category_id": cat2, "month": month, "budget_limit": 3000}  # insert
    ]
    
    bulk_res = await client.post("/api/v1/budgets/bulk", json=bulk_data)
    assert bulk_res.status_code == 201
    
    get_res = await client.get(f"/api/v1/budgets?month={month}")
    budgets = get_res.json()
    b1 = next(b for b in budgets if b["category_id"] == cat1)
    b2 = next(b for b in budgets if b["category_id"] == cat2)
    assert b1["budget_limit"] == 1500
    assert b2["budget_limit"] == 3000

async def test_post_rollover(client: AsyncClient):
    res = await client.get("/api/v1/categories")
    cats = res.json()
    cat1 = cats[0]["id"]
    cat2 = cats[1]["id"]
    
    from_m = "2026-06"
    to_m = "2026-07"
    
    # setup from_m
    await client.put(f"/api/v1/budgets/{cat1}/month/{from_m}", json={"budget_limit": 1111})
    await client.put(f"/api/v1/budgets/{cat2}/month/{from_m}", json={"budget_limit": 2222})
    
    # setup to_m overlapping
    await client.put(f"/api/v1/budgets/{cat1}/month/{to_m}", json={"budget_limit": 9999})
    
    rollover_data = {
        "from_month": from_m,
        "to_month": to_m
    }
    
    roll_res = await client.post("/api/v1/budgets/rollover", json=rollover_data)
    assert roll_res.status_code == 201
    
    # check to_m
    get_res = await client.get(f"/api/v1/budgets?month={to_m}")
    budgets = get_res.json()
    b1 = next(b for b in budgets if b["category_id"] == cat1)
    b2 = next(b for b in budgets if b["category_id"] == cat2)
    
    assert b1["budget_limit"] == 9999 # should not be overwritten
    assert b2["budget_limit"] == 2222 # should be copied
