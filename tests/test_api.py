import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app as fastapi_app
from app.core.database import Base, get_db
from sqlalchemy.pool import StaticPool
import app.models


# Create an in-memory SQLite database for test isolation
# StaticPool is required to keep the in-memory tables alive across sessions
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency during test execution
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db

# Create tables in the isolated test database
Base.metadata.create_all(bind=engine)

client = TestClient(fastapi_app)

def test_health_check():
    """Verify that the health check returns operational statistics."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["application_status"] == "Healthy"
    assert data["database_status"] == "Healthy"
    assert data["model_loaded"] is True

def test_auth_cycle():
    """Test user registration, login, token refresh, and logout flow."""
    # 1. Registration
    username = "test_agent_99"
    email = "agent99@neuroheart.ai"
    password = "StrongPassword123!"
    
    reg_res = client.post("/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["username"] == username
    
    # 2. Login
    login_res = client.post("/login", data={
        "username": username,
        "password": password
    })
    assert login_res.status_code == 200
    tokens = login_res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    
    # 3. Access Protected Route (Settings)
    headers = {"Authorization": f"Bearer {access_token}"}
    settings_res = client.get("/auth/settings", headers=headers)
    assert settings_res.status_code == 200
    assert settings_res.json()["theme"] == "dark"
    
    # 4. Token Refresh
    refresh_res = client.post("/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    new_access_token = new_tokens["access_token"]
    
    # 5. Access Protected Route with New Access Token
    new_headers = {"Authorization": f"Bearer {new_access_token}"}
    settings_res2 = client.get("/auth/settings", headers=new_headers)
    assert settings_res2.status_code == 200
    
    # 6. Logout
    logout_res = client.post("/auth/logout", headers=new_headers)
    assert logout_res.status_code == 200
    
    # 7. Access after Logout should be revoked (401)
    revoked_res = client.get("/auth/settings", headers=new_headers)
    assert revoked_res.status_code == 401

def test_prediction_diagnostics():
    """Verify that predictions run, map detailed contributors, and record history."""
    # Register and log in
    username = "diag_agent"
    email = "diag@neuroheart.ai"
    password = "StrongPassword123!"
    client.post("/register", json={"username": username, "email": email, "password": password})
    login_res = client.post("/login", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Telemetry data payload
    patient_telemetry = {
      "age": 55, "sex": 1, "cp": 0, "trestbps": 140, "chol": 250,
      "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0,
      "oldpeak": 1.5, "slope": 1, "ca": 0, "thal": 2
    }
    
    # Run prediction
    pred_res = client.post("/predict", json=patient_telemetry, headers=headers)
    assert pred_res.status_code == 200
    data = pred_res.json()
    
    # Verify new clinical indicators are returned alongside legacy fields
    assert "prediction" in data
    assert "probability" in data
    assert "risk_level" in data
    assert "confidence_score" in data
    assert "clinical_severity" in data
    assert "patient_summary" in data
    assert "risk_contributors" in data
    assert "protective_contributors" in data
    assert "lifestyle_recommendations" in data
    assert "recommended_medical_tests" in data
    assert "ai_disclaimer" in data
    
    # Verify legacy compatibility fields
    assert "patient_profile" in data
    assert "risk_factors" in data
    assert "shap_values_raw" in data
    assert "medical_summary" in data
    
    # Check history contains the record
    hist_res = client.get("/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) > 0
    assert history[0]["input_data"]["age"] == 55
