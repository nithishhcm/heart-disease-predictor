from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas import AnalyticsResponse
from app.services.analytics_service import AnalyticsService
from app.models import User

router = APIRouter(tags=["Platform Analytics"])
analytics_service = AnalyticsService()

@router.get("/analytics", response_model=AnalyticsResponse,
            description="Fetch aggregated statistics of prediction risk distribution, daily trends, patient age ranges, gender spreads, and system metrics.",
            summary="Get Platform Analytics")
def get_analytics(
    bypass_cache: bool = Query(False, description="Forces re-calculation of the database metrics."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_service.compute_platform_analytics(db, bypass_cache=bypass_cache)
