# NeuroHeart AI — Clinical Cardiovascular SaaS Platform

**NeuroHeart AI** is a production-quality, high-performance cardiovascular diagnostics and telemetry platform. It integrates a logistic regression machine learning model with SHAP (SHapley Additive exPlanations) coefficients, structured SQL schemas, role audits, automated PDF reporting, and a glowing glassmorphism React interface.

---

## Technical Highlights

- **Enterprise Refactoring**: Isolated layers separating HTTP routes, database handlers, repository patterns, and clinical processing services.
- **Dual Database Core**: Automatic connection pooling and PostgreSQL detection (via `DATABASE_URL` bindings) with seamless SQLite local developer fallback.
- **Clinical Explanations**: Refines complex mathematical SHAP factors into human-readable patient diagnostics, risk drivers, and physician summaries.
- **Automated Medical Reporting**: Compiles medical records into hospital-quality printable PDFs containing gauges, factor plots, doctor signing sheets, and security verification QR codes.
- **Wizard Compilation Form**: A responsive multi-step client wizard that validates inputs, details clinical ranges, and explains metrics.
- **Custom React SVGs**: Native HSL-themed gauges, timelines, and radars built without legacy libraries, guaranteeing React 19 compatibility.

---

## 1. Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for staging container runs)

### Local Server Setup
1. Clone the project and navigate to the backend workspace.
2. Install pip libraries:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Access API documentation at `http://127.0.0.1:8000/docs`.

### Local Client Setup
1. Navigate to the `frontend/` directory.
2. Install NPM dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite React server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to explore the dashboard.

---

## 2. Docker Architecture Run

To spin up the stagings environment with both the PostgreSQL database container and the FastAPI server, run:
```bash
docker-compose up --build
```
The database will mount volume paths to protect diagnostics data.

---

## 3. Running Verification Tests
Execute the isolated testing suite to verify logins, refreshed tokens, and SHAP diagnostics:
```bash
pytest tests/
```
For deep design specs, tables layout, and deployment guides, check the [Technical Architecture Manual](file:///c:/Users/NITHISHH%20CM/Desktop/heart-disease-predictor%20-%20Copy/docs/architecture.md).
