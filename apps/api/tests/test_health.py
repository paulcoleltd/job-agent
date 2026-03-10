"""Tests for health endpoint."""


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_health_version_format(client):
    resp = client.get("/health")
    version = resp.json()["version"]
    parts = version.split(".")
    assert len(parts) == 3
