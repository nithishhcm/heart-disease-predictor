from fastapi import APIRouter, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, check_rate_limit
from app.schemas import (
    UserCreate, UserResponse, Token, TokenRefreshRequest,
    LoginHistorySchema, AuditLogSchema, UserSettingsSchema
)
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository
from app.repositories.audit_repository import AuditRepository
from app.models import User

router = APIRouter(tags=["Authentication"])
auth_service = AuthService()
user_repo = UserRepository()
audit_repo = AuditRepository()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             description="Register a new system user. Password must meet complexity requirements.",
             summary="User Registration")
def register_user(
    user_data: UserCreate, 
    request: Request,
    db: Session = Depends(get_db),
    _ = Depends(check_rate_limit)
):
    ip_addr = request.client.host if request.client else None
    return auth_service.register(db, user_data, ip_address=ip_addr)

@router.post("/login", response_model=Token,
             description="Authenticate user credentials and obtain bearer JWT access and refresh tokens.",
             summary="User Login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db),
    _ = Depends(check_rate_limit)
):

    ip_addr = request.client.host if request.client else None
    agent = request.headers.get("user-agent")
    return auth_service.login(db, form_data.username, form_data.password, ip_address=ip_addr, user_agent=agent)

@router.post("/auth/refresh", response_model=Token,
             description="Provide a valid refresh token to acquire a fresh access token (rolling token pattern).",
             summary="Refresh Access Token")
def refresh_token(
    refresh_data: TokenRefreshRequest, 
    db: Session = Depends(get_db)
):
    return auth_service.refresh(db, refresh_data.refresh_token)

@router.post("/auth/logout", status_code=status.HTTP_200_OK,
             description="Revoke the current access token and invalidate the active session.",
             summary="User Logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Extract access token from auth header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        ip_addr = request.client.host if request.client else None
        auth_service.logout(db, token, ip_address=ip_addr)
    return {"detail": "Successfully logged out"}

@router.get("/auth/login-history", response_model=List[LoginHistorySchema],
             description="Retrieve authentication logs for the currently logged in user.",
             summary="Login History Audits")
def get_login_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return current_user.login_history

@router.get("/auth/audit-logs", response_model=List[AuditLogSchema],
             description="Retrieve recent system audit trails for the current user.",
             summary="System Audit Logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return audit_repo.get_user_logs(db, user_id=current_user.id)

@router.get("/auth/settings", response_model=UserSettingsSchema,
             description="Retrieve UI customization and privacy settings for the current user.",
             summary="User Settings")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = audit_repo.get_user_settings(db, user_id=current_user.id)
    if not settings:
        settings = audit_repo.update_user_settings(db, user_id=current_user.id, theme="dark", notifications=True, two_factor=False)
    return settings

@router.put("/auth/settings", response_model=UserSettingsSchema,
             description="Update dashboard custom styling and configurations.",
             summary="Update Settings")
def update_settings(
    settings_data: UserSettingsSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return audit_repo.update_user_settings(
        db, 
        user_id=current_user.id, 
        theme=settings_data.theme, 
        notifications=settings_data.notifications_enabled, 
        two_factor=settings_data.two_factor_enabled
    )
