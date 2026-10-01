import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def isolated_activities(monkeypatch):
    activities = {
        "Chess Club": {
            "description": "Practice chess",
            "schedule": "Fridays, 3:30 PM",
            "max_participants": 4,
            "participants": ["existing@mergington.edu"],
        }
    }
    monkeypatch.setattr(app_module, "activities", activities)
    return activities


@pytest.fixture
def client(isolated_activities):
    with TestClient(app_module.app) as test_client:
        yield test_client


def test_get_activities_returns_activity_data(client, isolated_activities):
    # Arrange
    expected = isolated_activities["Chess Club"]

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json()["Chess Club"] == expected


def test_signup_adds_student_and_updates_activities(client):
    # Arrange
    email = "new-student@mergington.edu"

    # Act
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert email in activities_response.json()["Chess Club"]["participants"]


def test_signup_rejects_duplicate_student(client, isolated_activities):
    # Arrange
    email = "existing@mergington.edu"
    original_participants = isolated_activities["Chess Club"]["participants"][:]

    # Act
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up"
    assert isolated_activities["Chess Club"]["participants"] == original_participants


def test_signup_returns_404_for_unknown_activity(client):
    # Arrange
    email = "student@mergington.edu"

    # Act
    response = client.post(
        "/activities/Unknown Club/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_remove_signup_removes_student_and_updates_activities(client):
    # Arrange
    email = "existing@mergington.edu"

    # Act
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": email},
    )
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from Chess Club"}
    assert email not in activities_response.json()["Chess Club"]["participants"]


def test_remove_signup_returns_404_for_missing_enrollment(client):
    # Arrange
    email = "not-enrolled@mergington.edu"

    # Act
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up"


def test_remove_signup_returns_404_for_unknown_activity(client):
    # Arrange
    email = "student@mergington.edu"

    # Act
    response = client.delete(
        "/activities/Unknown Club/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"