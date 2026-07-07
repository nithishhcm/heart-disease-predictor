from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.schemas import PatientData, UserCreate, UserResponse, Token, PredictionResponse, PredictionResponseV2, PredictionHistory
from app.predictor import predict
from app.explainer import explain
from app.response_builder import build_full_response
from app.database import engine, get_db, Base
from app.models import User, PredictionRecord
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS configuration
# NOTE: allow_credentials=True is incompatible with allow_origins=["*"] (CORS spec).
# We use JWT Bearer tokens, not cookies, so credentials=False is correct.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Heart Disease API running securely"}

@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/predict", response_model=PredictionResponseV2)
def predict_api(data: PatientData, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data_dict = data.dict()

    pred, prob, scaled = predict(data_dict)

    explanation = explain(
        scaled_input=scaled,
        feature_names=list(data_dict.keys())
    )
    
    # Save to database (save raw for history to save space)
    prediction_record = PredictionRecord(
        user_id=current_user.id,
        input_data=data_dict,
        prediction=int(pred),
        probability=float(prob),
        explanation=explanation
    )
    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)

    # Build and return the human-readable V2 response
    return build_full_response(
        prediction=int(pred),
        probability=float(prob),
        input_data=data_dict,
        shap_dict=explanation
    )

@app.get("/history", response_model=List[PredictionHistory])
def get_user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(PredictionRecord).filter(PredictionRecord.user_id == current_user.id).order_by(PredictionRecord.timestamp.desc()).all()
    return history