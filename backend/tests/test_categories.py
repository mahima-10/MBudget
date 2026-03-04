import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_get_categories(client: AsyncClient):
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10 # Seeder should give us at least 10 categories
    
    # Check structure
    cat = data[0]
    assert "id" in cat
    assert "name" in cat
    assert "icon" in cat
    assert "color" in cat
    assert "is_custom" in cat
    assert "created_at" in cat
    assert "updated_at" in cat

async def test_create_category(client: AsyncClient):
    new_cat = {
        "name": "Custom Hobby",
        "icon": "🎨",
        "color": "#123456"
    }
    response = await client.post("/api/v1/categories", json=new_cat)
    assert response.status_code == 201
    data = response.json()
    
    assert data["name"] == "Custom Hobby"
    assert data["icon"] == "🎨"
    assert data["color"] == "#123456"
    assert data["is_custom"] is True # Explicitly check it's forced to True
    
    return data["id"] # used for chained tests locally if needed

async def test_update_category(client: AsyncClient):
    # Create one first
    create_res = await client.post("/api/v1/categories", json={
        "name": "To Update",
        "icon": "X",
        "color": "#000"
    })
    cat_id = create_res.json()["id"]
    
    update_res = await client.put(f"/api/v1/categories/{cat_id}", json={
        "name": "Updated Name"
        # Not providing icon/color to test partial update if supported,
        # or just updating one field
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Name"
    # Should retain old icon
    assert update_res.json()["icon"] == "X"

async def test_update_category_not_found(client: AsyncClient):
    import uuid
    fake_id = str(uuid.uuid4())
    res = await client.put(f"/api/v1/categories/{fake_id}", json={"name": "Ghost"})
    assert res.status_code == 404

async def test_delete_custom_category(client: AsyncClient):
    # Create
    create_res = await client.post("/api/v1/categories", json={
        "name": "To Delete",
        "icon": "X",
        "color": "#000"
    })
    cat_id = create_res.json()["id"]
    
    # Delete
    del_res = await client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 204
    
    # Verify gone
    get_res = await client.get("/api/v1/categories")
    ids = [c["id"] for c in get_res.json()]
    assert cat_id not in ids

async def test_delete_predefined_category_fails(client: AsyncClient):
    # GET to find a predefined one
    get_res = await client.get("/api/v1/categories")
    predef = next((c for c in get_res.json() if c["is_custom"] is False), None)
    assert predef is not None, "No predefined categories found"
    
    del_res = await client.delete(f"/api/v1/categories/{predef['id']}")
    assert del_res.status_code == 400
    assert "predefined" in del_res.json()["detail"].lower()

async def test_delete_category_not_found(client: AsyncClient):
    import uuid
    fake_id = str(uuid.uuid4())
    res = await client.delete(f"/api/v1/categories/{fake_id}")
    assert res.status_code == 404
