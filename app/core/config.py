import os
from pydantic_settings import BaseSettings
from typing import List, Optional
from dotenv import load_dotenv

# Load env variables from a .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroHeart AI"
    API_VERSION: str = "v2"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_for_medical_ai_app_in_production_change_this")
    REFRESH_SECRET_KEY: str = os.getenv("REFRESH_SECRET_KEY", "superrefreshsecretkey_for_medical_ai_app_change_this")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Rate Limiting (default: 60 requests per minute per IP)
    RATE_LIMIT_CALLS: int = int(os.getenv("RATE_LIMIT_CALLS", "60"))
    RATE_LIMIT_PERIOD_SECONDS: int = int(os.getenv("RATE_LIMIT_PERIOD_SECONDS", "60"))
    
    # Database
    # Checks DATABASE_URL. If none or empty, falls back to local sqlite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medical_ai.db")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Model configuration
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/model.pkl")
    SCALER_PATH: str = os.getenv("SCALER_PATH", "models/scaler.pkl")
    BACKGROUND_DATA_PATH: str = os.getenv("BACKGROUND_DATA_PATH", "data/heart.csv")
    
    class Config:
        case_sensitive = True

settings = Settings()
