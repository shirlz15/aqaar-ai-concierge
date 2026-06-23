from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat_rejects_invalid_payload():
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 422


def test_lead_requires_consent():
    response = client.post(
        "/api/leads",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+96890000000",
            "preferred_contact_method": "phone",
            "consent_given": False,
            "session_id": "session-12345",
            "profile": {},
        },
    )
    assert response.status_code == 400
