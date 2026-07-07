from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models import AuditLog, UserSettings, AnalyticsCache
from datetime import date

class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    def add_log(self, db: Session, action: str, user_id: Optional[int] = None, ip_address: Optional[str] = None, details: Optional[str] = None) -> AuditLog:
        """Create a system audit trail event."""
        log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            details=details
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_user_logs(self, db: Session, user_id: int, limit: int = 50) -> List[AuditLog]:
        """Fetch audit logs for a single user, ordered by timestamp."""
        return db.query(AuditLog).filter(AuditLog.user_id == user_id).order_by(AuditLog.created_at.desc()).limit(limit).all()

    def get_user_settings(self, db: Session, user_id: int) -> Optional[UserSettings]:
        """Fetch settings for a single user."""
        return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    def update_user_settings(self, db: Session, user_id: int, theme: str, notifications: bool, two_factor: bool) -> UserSettings:
        """Updates or sets user dashboard settings."""
        settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            settings = UserSettings(user_id=user_id)
        settings.theme = theme
        settings.notifications_enabled = notifications
        settings.two_factor_enabled = two_factor
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    def get_analytics_cache(self, db: Session, target_date: date) -> Optional[AnalyticsCache]:
        """Check if precomputed analytics exist for a date."""
        return db.query(AnalyticsCache).filter(AnalyticsCache.date == target_date).first()

    def save_analytics_cache(self, db: Session, target_date: date, total_predictions: int, total_users: int, avg_prob: float, meta: dict) -> AnalyticsCache:
        """Cache computed analytics."""
        cache = db.query(AnalyticsCache).filter(AnalyticsCache.date == target_date).first()
        if not cache:
            cache = AnalyticsCache(date=target_date)
        cache.total_predictions = total_predictions
        cache.total_users = total_users
        cache.avg_probability = avg_prob
        cache.meta_data = meta
        db.add(cache)
        db.commit()
        db.refresh(cache)
        return cache
