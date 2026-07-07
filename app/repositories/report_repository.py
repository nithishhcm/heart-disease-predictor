from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models import PredictionReport

class ReportRepository(BaseRepository[PredictionReport]):
    def __init__(self):
        super().__init__(PredictionReport)

    def get_by_prediction_id(self, db: Session, prediction_id: int) -> Optional[PredictionReport]:
        """Fetch report by its associated prediction ID."""
        return db.query(PredictionReport).filter(PredictionReport.prediction_id == prediction_id).first()
