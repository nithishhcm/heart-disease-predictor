from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Handle Postgres Heroku/Render schema vs standard sqlalchemy schema
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Configure engines based on dialect
is_sqlite = db_url.startswith("sqlite")

if is_sqlite:
    # SQLite configuration for local development
    engine = create_engine(
        db_url, 
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL configuration for production
    engine = create_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_recycle=1800,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Database session generator to inject in routers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_sqlite_migrations():
    """
    Checks the local SQLite schema and dynamically adds new columns
    if upgrading from an older schema version, preserving all existing data.
    Accommodates SQLite limitations with non-constant defaults.
    """
    if not is_sqlite:
        return
        
    inspector = inspect(engine)
    
    # Check if table exists first (if users doesn't exist, Base.metadata.create_all will handle it)
    if 'users' not in inspector.get_table_names():
        return
        
    with engine.begin() as conn:
        # Check users table
        user_cols = [c['name'] for c in inspector.get_columns('users')]
        if 'is_active' not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        if 'created_at' not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            conn.execute(text("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL"))
        if 'updated_at' not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
            conn.execute(text("UPDATE users SET updated_at = datetime('now') WHERE updated_at IS NULL"))
            
        # Check predictions table
        pred_cols = [c['name'] for c in inspector.get_columns('predictions')]
        if 'risk_level' not in pred_cols:
            conn.execute(text("ALTER TABLE predictions ADD COLUMN risk_level VARCHAR"))
        if 'confidence_score' not in pred_cols:
            conn.execute(text("ALTER TABLE predictions ADD COLUMN confidence_score FLOAT"))
        if 'clinical_severity' not in pred_cols:
            conn.execute(text("ALTER TABLE predictions ADD COLUMN clinical_severity VARCHAR"))
        if 'created_at' not in pred_cols:
            conn.execute(text("ALTER TABLE predictions ADD COLUMN created_at DATETIME"))
            conn.execute(text("UPDATE predictions SET created_at = datetime('now') WHERE created_at IS NULL"))
        if 'updated_at' not in pred_cols:
            conn.execute(text("ALTER TABLE predictions ADD COLUMN updated_at DATETIME"))
            conn.execute(text("UPDATE predictions SET updated_at = datetime('now') WHERE updated_at IS NULL"))
        if 'timestamp' not in pred_cols:
            conn.execute(text("ALTER TABLE predictions ADD COLUMN timestamp DATETIME"))
            conn.execute(text("UPDATE predictions SET timestamp = datetime('now') WHERE timestamp IS NULL"))
