from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import SystemHealth
from app.services.analytics_service import AnalyticsService
from app.core.config import settings
from app.model_loader import model

router = APIRouter(tags=["System Health Check"])
analytics_service = AnalyticsService()

@router.get("/health", response_model=SystemHealth,
            description="Verify server status, model availability, database connections, and system performance.",
            summary="Get Health Status")
def check_health(db: Session = Depends(get_db)):
    # Check DB status
    db_status = "Healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "Unhealthy"
        
    stats = analytics_service.get_system_stats()
    
    return SystemHealth(
        application_status="Healthy",
        database_status=db_status,
        model_loaded=model is not None,
        memory_usage=stats["memory_usage"],
        cpu_usage=stats["cpu_usage"],
        version="2.1.0",
        environment=settings.ENVIRONMENT,
        uptime=stats["uptime"]
    )

