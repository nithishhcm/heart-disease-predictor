from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    predictions = relationship("PredictionRecord", back_populates="owner")


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    input_data = Column(JSON)
    prediction = Column(Integer)
    probability = Column(Float)
    explanation = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="predictions")
