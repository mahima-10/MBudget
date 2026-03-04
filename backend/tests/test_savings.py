import pytest
from httpx import AsyncClient
import uuid

pytestmark = pytest.mark.asyncio

async def test_post_goal_full(client: AsyncClient):
    data = {
        "name": "New Car",
        "target_amount": 1000000,
        "deadline": "2027-01-01"
    }
    res = await client.post("/api/v1/savings-goals", json=data)
    assert res.status_code == 201
    goal = res.json()
    assert goal["name"] == "New Car"
    assert goal["target_amount"] == 1000000
    assert goal["deadline"] == "2027-01-01"

async def test_post_goal_open(client: AsyncClient):
    data = {
        "name": "Rainy Day Fund",
        "target_amount": None,
        "deadline": None
    }
    res = await client.post("/api/v1/savings-goals", json=data)
    assert res.status_code == 201
    goal = res.json()
    assert goal["name"] == "Rainy Day Fund"
    assert goal["target_amount"] is None
    assert goal["deadline"] is None

async def test_get_goals_initial_zero(client: AsyncClient):
    await client.post("/api/v1/savings-goals", json={"name": "Zero Test"})
    
    res = await client.get("/api/v1/savings-goals")
    assert res.status_code == 200
    goals = res.json()
    
    # Check that our created goal is present and has 0 current_amount
    target_goal = next((g for g in goals if g["name"] == "Zero Test"), None)
    assert target_goal is not None
    assert target_goal["current_amount"] == 0

async def test_put_goal_update(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "To Update"})
    goal_id = create_res.json()["id"]
    
    put_res = await client.put(f"/api/v1/savings-goals/{goal_id}", json={"name": "Updated Name", "target_amount": 500})
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["name"] == "Updated Name"
    assert updated["target_amount"] == 500

async def test_put_goal_404(client: AsyncClient):
    res = await client.put(f"/api/v1/savings-goals/{uuid.uuid4()}", json={"name": "Ghost"})
    assert res.status_code == 404

async def test_post_allocation_positive(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "Fund Me"})
    goal_id = create_res.json()["id"]
    
    alloc_res = await client.post("/api/v1/savings-allocations", json={
        "goal_id": goal_id,
        "amount": 2000,
        "date": "2026-03-01"
    })
    assert alloc_res.status_code == 201
    assert alloc_res.json()["amount"] == 2000

async def test_post_allocation_negative(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "Withdraw Me"})
    goal_id = create_res.json()["id"]
    
    alloc_res = await client.post("/api/v1/savings-allocations", json={
        "goal_id": goal_id,
        "amount": -500,
        "date": "2026-03-02"
    })
    assert alloc_res.status_code == 201
    assert alloc_res.json()["amount"] == -500

async def test_get_allocations_required_query(client: AsyncClient):
    # Check 422 if missing goal_id
    res = await client.get("/api/v1/savings-allocations")
    assert res.status_code == 422

async def test_get_allocations_by_goal_id(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "My Goal"})
    goal_id = create_res.json()["id"]
    
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 100, "date": "2026-01-01"})
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 200, "date": "2026-01-02"})
    
    res = await client.get(f"/api/v1/savings-allocations?goal_id={goal_id}")
    assert res.status_code == 200
    allocs = res.json()
    assert len(allocs) == 2
    amounts = {a["amount"] for a in allocs}
    assert amounts == {100, 200}

async def test_delete_allocation(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "Del Alloc"})
    goal_id = create_res.json()["id"]
    
    alloc_res = await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 100, "date": "2026-01-01"})
    alloc_id = alloc_res.json()["id"]
    
    del_res = await client.delete(f"/api/v1/savings-allocations/{alloc_id}")
    assert del_res.status_code == 204
    
    get_res = await client.get(f"/api/v1/savings-allocations?goal_id={goal_id}")
    assert len(get_res.json()) == 0

async def test_delete_allocation_404(client: AsyncClient):
    res = await client.delete(f"/api/v1/savings-allocations/{uuid.uuid4()}")
    assert res.status_code == 404

async def test_delete_goal_cascades(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "Cascade Me"})
    goal_id = create_res.json()["id"]
    
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 100, "date": "2026-01-01"})
    
    # Delete the goal
    del_res = await client.delete(f"/api/v1/savings-goals/{goal_id}")
    assert del_res.status_code == 204
    
    # Check that allocations are gone
    # Depending on how cascade is verified, we can just check if GET /allocations works or is empty
    # Since goal_id no longer exists, getting by goal_id should just return empty list
    get_res = await client.get(f"/api/v1/savings-allocations?goal_id={goal_id}")
    assert len(get_res.json()) == 0

async def test_delete_goal_404(client: AsyncClient):
    res = await client.delete(f"/api/v1/savings-goals/{uuid.uuid4()}")
    assert res.status_code == 404

async def test_integration_computed_current_amount(client: AsyncClient):
    create_res = await client.post("/api/v1/savings-goals", json={"name": "Computed Field"})
    goal_id = create_res.json()["id"]
    
    # Add 100, add 200, withdraw 50 = net 250
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 100, "date": "2026-01-01"})
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": 200, "date": "2026-01-02"})
    await client.post("/api/v1/savings-allocations", json={"goal_id": goal_id, "amount": -50, "date": "2026-01-03"})
    
    res = await client.get("/api/v1/savings-goals")
    assert res.status_code == 200
    goals = res.json()
    target_goal = next(g for g in goals if g["id"] == goal_id)
    
    assert target_goal["current_amount"] == 250
