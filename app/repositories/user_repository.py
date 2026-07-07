from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models import User, LoginHistory, UserSettings

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        """Fetch user by username."""
        return db.query(User).filter(User.username == username).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Fetch user by email address."""
        return db.query(User).filter(User.email == email).first()

    def create_user_with_settings(self, db: Session, user: User) -> User:
        """Creates a user and automatically configures default application settings."""
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create default dark-mode settings for this user
        settings = UserSettings(user_id=user.id, theme="dark")
        db.add(settings)
        db.commit()
        
        return user

    def add_login_history(
        self, 
        db: Session, 
        user_id: int, 
        status: str, 
        ip_address: Optional[str] = None, 
        user_agent: Optional[str] = None, 
        failure_reason: Optional[str] = None
    ) -> LoginHistory:
        """Logs an authentication attempt (success/failure) for security audits."""
        history = LoginHistory(
            user_id=user_id,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=failure_reason
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return history
