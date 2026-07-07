from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class PatientData(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    fbs: int
    restecg: int
    thalach: int
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    explanation: Dict[str, Any]

class RiskFactors(BaseModel):
    high_risk: list[str]
    protective_factors: list[str]

class PredictionResponseV2(BaseModel):
    prediction: int
    probability: float
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

    class Config:
        from_attributes = True