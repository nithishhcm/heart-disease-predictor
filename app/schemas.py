from pydantic import BaseModel, Field, EmailStr
from typing import Dict, Any, List, Optional
from datetime import datetime, date

class PatientData(BaseModel):
    age: int = Field(..., ge=20, le=100, description="Age in years")
    sex: int = Field(..., ge=0, le=1, description="0 = Female, 1 = Male")
    cp: int = Field(..., ge=0, le=3, description="Chest Pain Type (0-3)")
    trestbps: int = Field(..., ge=80, le=200, description="Resting Blood Pressure (mmHg)")
    chol: int = Field(..., ge=100, le=600, description="Serum Cholesterol (mg/dL)")
    fbs: int = Field(..., ge=0, le=1, description="Fasting Blood Sugar > 120 mg/dL (1=True, 0=False)")
    restecg: int = Field(..., ge=0, le=2, description="Resting ECG Results (0-2)")
    thalach: int = Field(..., ge=60, le=220, description="Maximum Heart Rate (bpm)")
    exang: int = Field(..., ge=0, le=1, description="Exercise-Induced Angina (1=True, 0=False)")
    oldpeak: float = Field(..., ge=0.0, le=6.0, description="ST Depression induced by exercise")
    slope: int = Field(..., ge=0, le=2, description="Peak Exercise ST Slope (0-2)")
    ca: int = Field(..., ge=0, le=4, description="Number of major vessels (0-4)")
    thal: int = Field(..., ge=0, le=3, description="Thalassemia (0-3)")

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    explanation: Dict[str, Any]

class RiskFactors(BaseModel):
    high_risk: List[str]
    protective_factors: List[str]

# Contributor details for SHAP explanations
class ContributorDetail(BaseModel):
    feature: str
    label: str
    value: str
    impact: float
    contribution_percentage: float
    severity: str
    clinical_interpretation: str
    simple_explanation: str
    doctor_explanation: str

# Enhanced Prediction response incorporating clinical advice and maintaining V2 fields
class PredictionResponseV2(BaseModel):
    # Base model results
    prediction: int
    probability: float
    prediction_id: int
    prediction_timestamp: datetime
    
    # Extended clinical output fields
    risk_level: str
    confidence_score: float
    clinical_severity: str
    patient_summary: str
    medical_interpretation: str
    
    # Contributors
    risk_contributors: List[ContributorDetail]
    protective_contributors: List[ContributorDetail]
    
    # Clinical Recommendations
    lifestyle_recommendations: List[str]
    immediate_recommendations: List[str]
    recommended_medical_tests: List[str]
    recommended_specialists: List[str]
    follow_up_timeline: str
    
    # Metadata
    ai_disclaimer: str
    model_version: str
    
    # Old V2 fields kept for full backward compatibility
    patient_profile: Dict[str, str]
    risk_factors: RiskFactors
    shap_values_raw: Dict[str, float]
    medical_summary: str

class PredictionHistory(BaseModel):
    id: int
    input_data: Dict[str, Any]
    prediction: int
    probability: float
    explanation: Dict[str, Any]
    timestamp: datetime
    
    # Optional fields mapping to DB additions
    risk_level: Optional[str] = None
    confidence_score: Optional[float] = None
    clinical_severity: Optional[str] = None

    class Config:
        from_attributes = True

# Health Endpoint Schemas
class SystemHealth(BaseModel):
    application_status: str
    database_status: str
    model_loaded: bool
    memory_usage: str
    cpu_usage: str
    version: str
    environment: str
    uptime: str

# Settings Schema
class UserSettingsSchema(BaseModel):
    theme: str
    notifications_enabled: bool
    two_factor_enabled: bool

    class Config:
        from_attributes = True

# Audit Log Schema
class AuditLogSchema(BaseModel):
    id: int
    action: str
    ip_address: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Login History Schema
class LoginHistorySchema(BaseModel):
    id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    status: str
    failure_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics Response Schema
class AnalyticsResponse(BaseModel):
    total_users: int
    total_predictions: int
    average_probability: float
    risk_distribution: Dict[str, int]
    daily_predictions: Dict[str, int]
    age_distribution: Dict[str, int]
    gender_distribution: Dict[str, int]
    model_accuracy: float
    system_statistics: Dict[str, Any]