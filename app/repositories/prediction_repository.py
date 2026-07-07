from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.repositories.base_repository import BaseRepository
from app.models import PredictionRecord

class PredictionRepository(BaseRepository[PredictionRecord]):
    def __init__(self):
        super().__init__(PredictionRecord)

    def get_user_history_paginated(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 10,
        risk_level: Optional[str] = None,
        sort_by: str = "timestamp",
        sort_order: str = "desc",
        search: Optional[str] = None
    ) -> Tuple[List[PredictionRecord], int]:
        """
        Retrieves a paginated list of predictions for a specific user.
        Supports filtering by risk level, sorting, search, and returns total count.
        """
        query = db.query(PredictionRecord).filter(PredictionRecord.user_id == user_id)
        
        # Risk level filtering
        if risk_level:
            query = query.filter(PredictionRecord.risk_level == risk_level)
            
        # Text-based search inside JSON input_data values or clinical features (if supported by sqlite/postgres)
        # We can perform a general string match check on age or clinical severity
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (PredictionRecord.clinical_severity.ilike(search_pattern)) |
                (PredictionRecord.risk_level.ilike(search_pattern))
            )
            
        # Get total count before pagination
        total_count = query.count()
        
        # Sorting
        sort_attr = getattr(PredictionRecord, sort_by, PredictionRecord.timestamp)
        if sort_order == "desc":
            query = query.order_by(desc(sort_attr))
        else:
            query = query.order_by(asc(sort_attr))
            
        records = query.offset(skip).limit(limit).all()
        return records, total_count
