# NeuroHeart AI — Technical Architecture & Deployment Documentation

This document describes the software design patterns, folder structure, database models, API specs, and staging configurations implemented in the **NeuroHeart AI** cardiovascular SaaS platform.

---

## 1. Directory Structure

The project conforms to clean-code separation guidelines:

```
heart-disease-predictor/
├── .github/workflows/          # CI/CD pipelines
│   └── ci.yml                 # Automation test pipeline
├── app/                        # Server Application Root
│   ├── core/                  # Core modules
│   │   ├── config.py          # Environment settings
│   │   ├── database.py        # Connection setup & migrations
│   │   ├── security.py        # Cryptography and token blacklists
│   │   ├── logging.py         # JSON logs setup
│   │   └── dependencies.py    # DI parameters & rate limiters
│   ├── models/                # SQLAlchemy Models
│   │   └── (All tables defined inside app/models.py)
│   ├── schemas/               # Pydantic Schemas
│   │   └── (All DTO models defined inside app/schemas.py)
│   ├── repositories/          # Database Queries (Repository Pattern)
│   │   ├── base_repository.py
│   │   ├── user_repository.py
│   │   ├── prediction_repository.py
│   │   └── report_repository.py
│   ├── services/              # Business Logic (Service Layer)
│   │   ├── auth_service.py
│   │   ├── prediction_service.py
│   │   ├── report_service.py
│   │   └── analytics_service.py
│   ├── routers/               # HTTP Routers (Endpoints)
│   │   ├── auth.py
│   │   ├── prediction.py
│   │   ├── analytics.py
│   │   └── health.py
│   ├── utils/                 # Utilities
│   │   ├── pdf_generator.py   # PDF drawing
│   │   └── chart_generator.py # Matplotlib compiler
│   └── main.py                # FastAPI Initialization entrypoint
├── data/                       # Diagnostic csv files
├── models/                     # Scikit-learn pickle files
├── frontend/                   # Client Application Root (Vite + React)
│   ├── src/
│   │   ├── components/        # ECG waves, Wizard forms, SVG charts
│   │   ├── pages/             # Landing, Dashboards, History grids
│   │   ├── utils/             # api Axios client
│   │   └── App.jsx            # Routing manager
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                  # Production container definitions
├── docker-compose.yml          # Staging environments setup
└── requirements.txt            # Python dependencies
```

---

## 2. Database Models (SQLite & PostgreSQL)

The platform supports **dynamic SQLite and PostgreSQL database pooling** based on connection strings. Foreign key constraints with cascade deletions are enforced programmatically.

```mermaid
erDiagram
    users ||--o{ predictions : records
    users ||--o{ prediction_reports : downloads
    users ||--o{ login_history : auth_attempts
    users ||--o{ audit_logs : actions
    users ||--|| user_settings : holds
    
    predictions ||--|| prediction_reports : references
    
    users {
        int id PK
        string username UK
        string email UK
        string hashed_password
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    predictions {
        int id PK
        int user_id FK
        json input_data
        int prediction
        float probability
        json explanation
        string risk_level
        float confidence_score
        string clinical_severity
        datetime timestamp
    }
    
    prediction_reports {
        string id PK "UUID"
        int prediction_id FK "Unique"
        int user_id FK
        json report_data
        string pdf_path
        datetime created_at
    }
    
    login_history {
        int id PK
        int user_id FK
        string ip_address
        string user_agent
        string status
        string failure_reason
        datetime created_at
    }
    
    token_revocations {
        int id PK
        string token UK
        string token_type
        datetime expires_at
        datetime created_at
    }
    
    audit_logs {
        int id PK
        int user_id FK
        string action
        string ip_address
        text details
        datetime created_at
    }
    
    user_settings {
        int id PK
        int user_id FK "Unique"
        string theme
        boolean notifications_enabled
        boolean two_factor_enabled
    }
```

---

## 3. Deployment & Staging Instructions

### Staging locally via Docker Compose
To build and spin up the complete production architecture locally, run:
```bash
docker-compose up --build
```
This launches:
- A PostgreSQL 15 database listening on port `5432` with persistent volumes.
- The Python FastAPI backend listening on port `8000`.

### Database Migrations (SQLite → PostgreSQL)
The application handles schema creation and database migrations automatically:
1. When configured with `DATABASE_URL` pointing to SQLite, it boots up and inspects if new columns are missing, running ALTER statements dynamically to preserve telemetry logs.
2. When configured with a PostgreSQL `DATABASE_URL` (in production/staging), it runs `Base.metadata.create_all` on startup, compiling constraints, cascade deletes, composite indexes, and relationships automatically.
3. Credentials should never be committed to source code. Set them in a `.env` file or environment panel.
