import time
from typing import Generator, Dict, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.models import User, TokenRevocation

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Simple in-memory rate limiting store (IP -> list of timestamps)
rate_limit_store: Dict[str, List[float]] = {}

def check_rate_limit(request: Request):
    """Enforces rate limiting based on client IP."""
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Initialize list if IP not seen before
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = []
        
    # Filter out timestamps outside the sliding window
    timestamps = rate_limit_store[client_ip]
    window_start = current_time - settings.RATE_LIMIT_PERIOD_SECONDS
    timestamps = [t for t in timestamps if t > window_start]
    
    if len(timestamps) >= settings.RATE_LIMIT_CALLS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
        
    # Record current request
    timestamps.append(current_time)
    rate_limit_store[client_ip] = timestamps

def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """Dependency to validate JWT tokens and fetch the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check token revocation first
    revoked = db.query(TokenRevocation).filter(TokenRevocation.token == token).first()
    if revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been terminated. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    payload = decode_token(token, is_refresh=False)
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    # Check if user is active (if active check is desired)
    return user
