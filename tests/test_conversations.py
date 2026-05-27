import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_create_conversation(client: AsyncClient):
    response = await client.post(
        "/api/conversations",
        json={"title": "Test Chat", "model": "llama3.2"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Chat"
    assert data["model"] == "llama3.2"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_conversations(client: AsyncClient):
    await client.post(
        "/api/conversations",
        json={"title": "Chat 1", "model": "llama3.2"},
    )
    response = await client.get("/api/conversations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_conversation(client: AsyncClient):
    create = await client.post(
        "/api/conversations",
        json={"title": "Get Test", "model": "llama3.2"},
    )
    conv_id = create.json()["id"]
    response = await client.get(f"/api/conversations/{conv_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Get Test"


@pytest.mark.asyncio
async def test_delete_conversation(client: AsyncClient):
    create = await client.post(
        "/api/conversations",
        json={"title": "Delete Me", "model": "llama3.2"},
    )
    conv_id = create.json()["id"]
    response = await client.delete(f"/api/conversations/{conv_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_conversation_not_found(client: AsyncClient):
    response = await client.get("/api/conversations/99999")
    assert response.status_code == 404