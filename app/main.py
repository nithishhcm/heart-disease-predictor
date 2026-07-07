from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, run_sqlite_migrations
from app.core.logging import api_logger, log_event
from app.routers import auth, prediction, analytics, health
import time

# Create database tables automatically
# Note: For SQLite, this creates medical_ai.db. For PostgreSQL, it initializes schemas in target tables.
Base.metadata.create_all(bind=engine)
run_sqlite_migrations()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="NeuroHeart AI - Commercial clinical-grade cardiovascular risk telemetry and explanation dashboard.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# In production, specify explicit domains using environment settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware for Security Headers & Request Audits
@app.middleware("http")
async def add_security_headers_and_log(request: Request, call_next):
    start_time = time.time()
    
    # Run request
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # 1. Inject Security Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' *;"
    )
    
    # 2. Log API Transaction
    client_ip = request.client.host if request.client else "unknown"
    log_event(
        api_logger,
        f"{request.method} {request.url.path} responded {response.status_code} in {duration:.4f}s",
        extra={
            "ip": client_ip,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration": duration
        }
    )
    
    return response

# Register API Routers under Root for legacy compatibility (matching existing UI paths)
app.include_router(auth.router)
app.include_router(prediction.router)
app.include_router(analytics.router)
app.include_router(health.router)

@app.get("/")
def home():
    return {
        "status": "Healthy",
        "message": "NeuroHeart AI Cardiovascular Inference Engine running securely.",
        "version": settings.API_VERSION
    }

# Print registered routes for debug tracing
print("\n========== REGISTERED ROUTES ==========")
for route in app.routes:
    if hasattr(route, "methods") and hasattr(route, "path"):
        methods = ",".join(route.methods or [])
        print(f"{methods:20} {route.path}")
print("=======================================\n")