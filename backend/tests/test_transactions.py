import pytest
from httpx import AsyncClient
from datetime import date

pytestmark = pytest.mark.asyncio

async def get_category_id(client: AsyncClient):
    res = await client.get("/api/v1/categories")
    return res.json()[0]["id"]

async def test_get_empty_transactions(client: AsyncClient):
    res = await client.get("/api/v1/transactions?month=1999-01")
    assert res.status_code == 200
    assert len(res.json()) == 0

async def test_post_expense_with_category(client: AsyncClient):
    cat_id = await get_category_id(client)
    tx_data = {
        "type": "expense",
        "amount": 15000,
        "date": "2026-03-01",
        "category_id": cat_id,
        "notes": "Lunch"
    }
    
    res = await client.post("/api/v1/transactions", json=tx_data)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 15000
    assert data["type"] == "expense"
    assert data["category_id"] == cat_id
    assert "category" in data
    assert data["category"]["id"] == cat_id

async def test_post_income_without_category(client: AsyncClient):
    tx_data = {
        "type": "income",
        "amount": 500000,
        "date": "2026-03-02",
        "category_id": None,
        "notes": "Salary"
    }
    
    res = await client.post("/api/v1/transactions", json=tx_data)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 500000
    assert data["type"] == "income"
    assert data["category_id"] is None
    assert data["category"] is None

async def test_get_filter_by_month(client: AsyncClient):
    cat_id = await get_category_id(client)
    # Create one in April, one in May
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 100, "date": "2026-04-15", "category_id": cat_id})
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 200, "date": "2026-05-15", "category_id": cat_id})
    
    res = await client.get("/api/v1/transactions?month=2026-04")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["amount"] == 100

async def test_get_filter_by_type(client: AsyncClient):
    cat_id = await get_category_id(client)
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 100, "date": "2026-06-01", "category_id": cat_id})
    await client.post("/api/v1/transactions", json={"type": "income", "amount": 200, "date": "2026-06-02", "category_id": None})
    
    res = await client.get("/api/v1/transactions?month=2026-06&type=income")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["type"] == "income"
    assert data[0]["amount"] == 200

async def test_get_filter_by_search(client: AsyncClient):
    cat_id = await get_category_id(client)
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 100, "date": "2026-07-01", "category_id": cat_id, "notes": "Grocery shopping"})
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 200, "date": "2026-07-02", "category_id": cat_id, "notes": "Uber ride"})
    
    res = await client.get("/api/v1/transactions?month=2026-07&search=grocery")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["notes"] == "Grocery shopping"

async def test_get_sort_by_amount_asc(client: AsyncClient):
    cat_id = await get_category_id(client)
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 500, "date": "2026-08-01", "category_id": cat_id})
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 100, "date": "2026-08-02", "category_id": cat_id})
    await client.post("/api/v1/transactions", json={"type": "expense", "amount": 300, "date": "2026-08-03", "category_id": cat_id})
    
    res = await client.get("/api/v1/transactions?month=2026-08&sort_by=amount&sort_order=asc")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 3
    assert data[0]["amount"] == 100
    assert data[1]["amount"] == 300
    assert data[2]["amount"] == 500

async def test_put_update_transaction(client: AsyncClient):
    cat_id = await get_category_id(client)
    res_create = await client.post("/api/v1/transactions", json={"type": "expense", "amount": 100, "date": "2026-09-01", "category_id": cat_id})
    tx_id = res_create.json()["id"]
    
    res_update = await client.put(f"/api/v1/transactions/{tx_id}", json={"amount": 200, "notes": "Updated"})
    assert res_update.status_code == 200
    data = res_update.json()
    assert data["amount"] == 200
    assert data["notes"] == "Updated"
    assert data["type"] == "expense" # unchanged

async def test_put_update_not_found(client: AsyncClient):
    import uuid
    fake_id = str(uuid.uuid4())
    res = await client.put(f"/api/v1/transactions/{fake_id}", json={"amount": 100})
    assert res.status_code == 404

async def test_delete_transaction(client: AsyncClient):
    cat_id = await get_category_id(client)
    res_create = await client.post("/api/v1/transactions", json={"type": "expense", "amount": 100, "date": "2026-10-01", "category_id": cat_id})
    tx_id = res_create.json()["id"]
    
    res_del = await client.delete(f"/api/v1/transactions/{tx_id}")
    assert res_del.status_code == 204
    
    res_get = await client.get(f"/api/v1/transactions?month=2026-10")
    txs = res_get.json()
    assert not any(t["id"] == tx_id for t in txs)

async def test_delete_not_found(client: AsyncClient):
    import uuid
    fake_id = str(uuid.uuid4())
    res = await client.delete(f"/api/v1/transactions/{fake_id}")
    assert res.status_code == 404
