from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    validate_password_strength,
    validate_email_format,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.repositories.user_repository import UserRepository
from app.repositories.audit_repository import AuditRepository
from app.models import User, TokenRevocation

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.audit_repo = AuditRepository()

    def register(self, db: Session, user_data, ip_address: Optional[str] = None) -> User:
        """Validates credentials and registers a new system user with settings."""
        # 1. Validation
        validate_email_format(user_data.email)
        validate_password_strength(user_data.password)
        
        # Check existing username
        if self.user_repo.get_by_username(db, user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
            
        # Check existing email
        if self.user_repo.get_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # 2. Creation
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )
        created_user = self.user_repo.create_user_with_settings(db, new_user)
        
        # 3. Log
        self.audit_repo.add_log(
            db, 
            action="REGISTER", 
            user_id=created_user.id, 
            ip_address=ip_address, 
            details=f"User {created_user.username} successfully registered."
        )
        return created_user

    def login(
        self, 
        db: Session, 
        username: str, 
        password: str, 
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """Verifies credentials, logs the result, and generates access and refresh tokens."""
        user = self.user_repo.get_by_username(db, username)
        
        if not user:
            # Add failed login record to an audit log but user_id is None
            self.audit_repo.add_log(
                db, 
                action="LOGIN_FAILED", 
                ip_address=ip_address, 
                details=f"Login attempt failed for non-existent user: {username}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not verify_password(password, user.hashed_password):
            self.user_repo.add_login_history(
                db, user_id=user.id, status="Failed", ip_address=ip_address, user_agent=user_agent, failure_reason="Incorrect passcode"
            )
            self.audit_repo.add_log(
                db, action="LOGIN_FAILED", user_id=user.id, ip_address=ip_address, details=f"Incorrect password for user: {username}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Log successful attempt
        self.user_repo.add_login_history(
            db, user_id=user.id, status="Success", ip_address=ip_address, user_agent=user_agent
        )
        self.audit_repo.add_log(
            db, action="LOGIN_SUCCESS", user_id=user.id, ip_address=ip_address, details=f"User {username} logged in."
        )
        
        # Token generations
        access_token = create_access_token(data={"sub": user.username})
        refresh_token = create_refresh_token(data={"sub": user.username})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def refresh(self, db: Session, refresh_token: str) -> dict:
        """Validates a refresh token and generates a new access token."""
        # Check if refresh token is blacklisted
        revoked = db.query(TokenRevocation).filter(TokenRevocation.token == refresh_token).first()
        if revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )
            
        payload = decode_token(refresh_token, is_refresh=True)
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload"
            )
            
        user = self.user_repo.get_by_username(db, username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        # Generate new tokens
        new_access = create_access_token(data={"sub": user.username})
        new_refresh = create_refresh_token(data={"sub": user.username})
        
        # Revoke the old refresh token to prevent reuse (rolling tokens pattern)
        expires_at = datetime.utcfromtimestamp(payload.get("exp"))
        revocation = TokenRevocation(token=refresh_token, token_type="refresh", expires_at=expires_at)
        db.add(revocation)
        db.commit()
        
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer"
        }

    def logout(self, db: Session, access_token: str, ip_address: Optional[str] = None) -> None:
        """Revokes the current session's token by blacklisting it."""
        try:
            payload = decode_token(access_token, is_refresh=False)
            username = payload.get("sub")
            user = self.user_repo.get_by_username(db, username)
            user_id = user.id if user else None
            
            # Put token on blacklist
            exp = datetime.utcfromtimestamp(payload.get("exp"))
            revocation = TokenRevocation(token=access_token, token_type="access", expires_at=exp)
            db.add(revocation)
            db.commit()
            
            self.audit_repo.add_log(
                db, action="LOGOUT", user_id=user_id, ip_address=ip_address, details=f"User {username} logged out."
            )
        except Exception:
            # If token already expired or invalid, we still allow logout to happen client side
            pass
