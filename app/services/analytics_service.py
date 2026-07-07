import os
import psutil
import time
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.repositories.audit_repository import AuditRepository
from app.models import User, PredictionRecord, AnalyticsCache
from app.schemas import AnalyticsResponse

START_TIME = time.time()

class AnalyticsService:
    def __init__(self):
        self.audit_repo = AuditRepository()

    def get_system_stats(self) -> dict:
        """Collects server hardware telemetry (CPU, Memory, Uptime)."""
        uptime_seconds = time.time() - START_TIME
        uptime_str = str(timedelta(seconds=int(uptime_seconds)))
        
        cpu = f"{psutil.cpu_percent()}%"
        memory = f"{psutil.virtual_memory().percent}%"
        
        return {
            "cpu_usage": cpu,
            "memory_usage": memory,
            "uptime": uptime_str,
            "platform_os": os.name,
            "process_id": os.getpid()
        }

    def compute_platform_analytics(self, db: Session, bypass_cache: bool = False) -> dict:
        """Computes comprehensive cardiovascular demographics and platform analytics."""
        today = date.today()
        
        # Check cache first unless bypassed
        if not bypass_cache:
            cache = self.audit_repo.get_analytics_cache(db, today)
            if cache:
                return {
                    "total_users": cache.total_users,
                    "total_predictions": cache.total_predictions,
                    "average_probability": cache.avg_probability,
                    **cache.meta_data
                }
                
        # 1. Base counts
        total_users = db.query(User).count()
        total_predictions = db.query(PredictionRecord).count()
        
        # 2. Avg probability
        avg_prob_res = db.query(func.avg(PredictionRecord.probability)).scalar()
        avg_prob = round(float(avg_prob_res), 4) if avg_prob_res is not None else 0.0
        
        # 3. Retrieve all prediction data for distribution analysis (DB agnostic parsing)
        records = db.query(
            PredictionRecord.prediction,
            PredictionRecord.probability,
            PredictionRecord.input_data,
            PredictionRecord.timestamp
        ).all()
        
        risk_dist = {"High Risk": 0, "Low Risk": 0}
        gender_dist = {"Male": 0, "Female": 0}
        age_dist = {"20-29": 0, "30-39": 0, "40-49": 0, "50-59": 0, "60-69": 0, "70+": 0}
        daily_preds = {}
        
        for record in records:
            # Risk
            if record.prediction == 1:
                risk_dist["High Risk"] += 1
            else:
                risk_dist["Low Risk"] += 1
                
            # Input data dictionary parsing
            inp = record.input_data or {}
            
            # Gender distribution
            sex_val = inp.get("sex")
            if sex_val is not None:
                if int(sex_val) == 1:
                    gender_dist["Male"] += 1
                else:
                    gender_dist["Female"] += 1
                    
            # Age distribution
            age_val = inp.get("age")
            if age_val is not None:
                age = int(age_val)
                if age < 30:
                    age_dist["20-29"] += 1
                elif age < 40:
                    age_dist["30-39"] += 1
                elif age < 50:
                    age_dist["40-49"] += 1
                elif age < 60:
                    age_dist["50-59"] += 1
                elif age < 70:
                    age_dist["60-69"] += 1
                else:
                    age_dist["70+"] += 1
                    
            # Daily trends (last 14 days)
            day_str = record.timestamp.strftime("%Y-%m-%d")
            daily_preds[day_str] = daily_preds.get(day_str, 0) + 1
            
        # Fill in last 14 days if missing
        sorted_daily_preds = {}
        for i in range(13, -1, -1):
            d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            sorted_daily_preds[d] = daily_preds.get(d, 0)
            
        # Static model accuracy metric (matching landing page specifications)
        model_accuracy = 0.885
        
        sys_telemetry = self.get_system_stats()
        
        meta = {
            "risk_distribution": risk_dist,
            "daily_predictions": sorted_daily_preds,
            "age_distribution": age_dist,
            "gender_distribution": gender_dist,
            "model_accuracy": model_accuracy,
            "system_statistics": sys_telemetry
        }
        
        # Save cache
        self.audit_repo.save_analytics_cache(
            db, 
            target_date=today,
            total_predictions=total_predictions,
            total_users=total_users,
            avg_prob=avg_prob,
            meta=meta
        )
        
        return {
            "total_users": total_users,
            "total_predictions": total_predictions,
            "average_probability": avg_prob,
            **meta
        }

