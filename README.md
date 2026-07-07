# 🫀 NeuroHeart AI
## AI-Powered Cardiovascular Risk Prediction & Clinical Intelligence Platform

![NeuroHeart AI](https://img.shields.io/badge/AI-Healthcare-blue)
![Python](https://img.shields.io/badge/Python-3.x-yellow)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![Machine Learning](https://img.shields.io/badge/Machine-Learning-orange)

---

## 🌐 Live Application

🚀 **Frontend (Production):**

https://heart-disease-predictor-nithishh.vercel.app

⚙️ **Backend API:**

https://heart-disease-predictor-mwgp.onrender.com

📚 **API Documentation:**

https://heart-disease-predictor-mwgp.onrender.com/docs

---

# 📌 Overview

**NeuroHeart AI** is a full-stack artificial intelligence healthcare platform designed to predict cardiovascular disease risk and provide meaningful clinical explanations through an interactive dashboard.

The system combines:

- Machine Learning prediction models
- FastAPI backend services
- React-based user interface
- Secure authentication
- Automated medical report generation

The goal of NeuroHeart AI is to demonstrate how AI can assist healthcare professionals and users by transforming cardiovascular health data into understandable risk insights.

---

# ✨ Key Features

## 🔐 Secure User Authentication

- User registration and login system
- JWT-based authentication
- Secure token management
- User-specific prediction history
- Protected API endpoints


## 🧠 AI Cardiovascular Risk Prediction

- Machine learning-powered disease risk estimation
- Probability-based prediction scores
- Health parameter analysis
- AI-generated risk explanations
- Clinical-style output visualization


## 📊 Interactive Health Dashboard

Features include:

- Cardiovascular risk overview
- Prediction results visualization
- Patient health insights
- Analytics dashboard
- Structured medical interpretation


## 📄 Automated Medical Reports

The platform can generate:

- Patient summary reports
- Risk assessment reports
- Prediction explanations
- Downloadable PDF documents


## 🌐 Production Deployment

The application is deployed using:

- Frontend → Vercel
- Backend → Render
- Version Control → GitHub

The architecture supports real users accessing the application from any device.

---

# 🏗️ System Architecture

```
                         USER
                          |
                          |
                          ↓
              React + Vite Frontend
                    (Vercel)
                          |
                          |
                    REST API
                          |
                          ↓
                FastAPI Backend
                   (Render)
                          |
          --------------------------------
          |                              |
          ↓                              ↓
 Machine Learning Model              Database
          |
          ↓
 Cardiovascular Risk Prediction
          |
          ↓
 Clinical Explanation + Reports
```

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- Axios
- HTML/CSS
- Responsive UI Design


## Backend

- Python
- FastAPI
- Uvicorn
- JWT Authentication
- SQLAlchemy
- REST API Architecture


## Machine Learning

- Scikit-learn
- NumPy
- Pandas
- Matplotlib
- Trained ML Models


## Database

- SQLite (Development)
- Database-driven user management
- User-specific data storage


## Deployment

- GitHub
- Vercel
- Render
- Docker Support

---

# 📂 Project Structure

```
heart-disease-predictor/

│
├── app/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── API logic
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── api.js
│   ├── package.json
│   └── Vite configuration
│
├── models/
│   └── Machine learning models
│
├── data/
│   └── Dataset files
│
├── reports_cache/
│   └── Generated reports
│
├── plots/
│   └── Visualization outputs
│
├── tests/
│   └── Testing files
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

# ⚙️ Local Installation

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/heart-disease-predictor.git

cd heart-disease-predictor
```

---

# Backend Setup

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

### Windows

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

API Documentation:

```
http://localhost:8000/docs
```

---

# Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create environment file:

```
.env
```

Add:

```
VITE_API_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

# 🔌 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Backend status |
| `/register` | POST | Create user account |
| `/login` | POST | User authentication |
| `/predict` | POST | Cardiovascular prediction |
| `/health` | GET | Health monitoring |
| `/report/pdf` | POST | Generate PDF report |
| `/docs` | GET | Swagger API documentation |

---

# 🧬 Machine Learning Pipeline

```
Dataset
   |
   ↓
Data Cleaning
   |
   ↓
Feature Processing
   |
   ↓
Model Training
   |
   ↓
Model Evaluation
   |
   ↓
Saved Model
   |
   ↓
FastAPI Inference Engine
   |
   ↓
Frontend Risk Dashboard
```

---

# 🔒 Security Implementation

Implemented security features:

- JWT authentication
- Password protection
- Secure API communication
- Environment variable configuration
- CORS configuration
- User data separation

---

# 🚀 Deployment Architecture

```
GitHub Repository
        |
        |
        ↓
     Vercel
        |
        |
 React Frontend
        |
        |
        ↓
     Render
        |
        |
 FastAPI Backend
        |
        |
 ML Inference Engine
```

---

# 📈 Future Improvements

Planned upgrades:

- PostgreSQL production database
- SHAP-based Explainable AI
- Doctor monitoring dashboard
- Real-time health monitoring
- Mobile application
- Advanced ML model comparison
- Cloud model monitoring
- Automated CI/CD pipeline

---

# 🎯 Project Goals

NeuroHeart AI demonstrates:

✅ Full-stack AI development  
✅ Machine Learning deployment  
✅ Cloud deployment  
✅ API engineering  
✅ Authentication systems  
✅ Healthcare AI applications  


---

# 👨‍💻 Author

## CM Nithishh

B.Tech Artificial Intelligence and Machine Learning

---

# ⭐ Acknowledgement

This project was developed as an exploration of applied Artificial Intelligence in healthcare, combining machine learning, software engineering, and cloud deployment practices.

---

⭐ If you find this project interesting, consider starring the repository.
