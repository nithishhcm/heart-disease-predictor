import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from app.repositories.report_repository import ReportRepository
from app.repositories.prediction_repository import PredictionRepository
from app.services.prediction_service import PredictionService
from app.utils.pdf_generator import build_pdf_report
from app.models import PredictionReport

# Create directory to cache pdf files
REPORTS_CACHE_DIR = os.path.join(os.getcwd(), "reports_cache")
os.makedirs(REPORTS_CACHE_DIR, exist_ok=True)

class ReportService:
    def __init__(self):
        self.report_repo = ReportRepository()
        self.pred_repo = PredictionRepository()
        self.pred_service = PredictionService()

    def get_or_create_report(self, db: Session, prediction_id: int, user_id: int, host_url: str = "http://127.0.0.1:8000") -> dict:
        """Retrieves an existing cached report or compiles a new one from prediction results."""
        prediction = self.pred_repo.get(db, prediction_id)
        if not prediction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")
            
        if prediction.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this report.")
            
        # Check if already cached
        cached_report = self.report_repo.get_by_prediction_id(db, prediction_id)
        if cached_report:
            return {
                "report_id": cached_report.id,
                "pdf_path": cached_report.pdf_path,
                "created_at": cached_report.created_at,
                "report_data": cached_report.report_data
            }
            
        # If not cached, build clinical details and generate PDF
        clinical_data = self.pred_service.build_clinical_response(prediction)
        
        # Build PDF binary
        pdf_bytes = build_pdf_report(
            prediction_id=prediction.id,
            timestamp=prediction.timestamp,
            risk_level=prediction.risk_level,
            probability=prediction.probability,
            severity=prediction.clinical_severity,
            confidence=prediction.confidence_score,
            patient_profile=clinical_data["patient_profile"],
            shap_raw=prediction.explanation,
            clinical_summary=clinical_data["patient_summary"],
            interpretation=clinical_data["medical_interpretation"],
            tests=clinical_data["recommended_medical_tests"],
            specialists=clinical_data["recommended_specialists"],
            lifestyle=clinical_data["lifestyle_recommendations"],
            timeline=clinical_data["follow_up_timeline"],
            model_version=clinical_data["model_version"],
            ai_disclaimer=clinical_data["ai_disclaimer"],
            verify_url=f"{host_url}/api/report/verify"
        )
        
        # Save PDF to caching folder
        report_uuid = str(uuid.uuid4())
        filename = f"report_{report_uuid}.pdf"
        file_path = os.path.join(REPORTS_CACHE_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Save record reference to DB
        report_record = PredictionReport(
            id=report_uuid,
            prediction_id=prediction_id,
            user_id=user_id,
            report_data=jsonable_encoder(clinical_data),
            pdf_path=file_path
        )
        self.report_repo.create(db, report_record)
        
        return {
            "report_id": report_record.id,
            "pdf_path": report_record.pdf_path,
            "created_at": report_record.created_at,
            "report_data": clinical_data
        }

    def get_pdf_bytes(self, db: Session, prediction_id: int, user_id: int) -> bytes:
        """Fetches the cached PDF report file and returns its bytes."""
        report_info = self.get_or_create_report(db, prediction_id, user_id)
        file_path = report_info["pdf_path"]
        
        if not os.path.exists(file_path):
            # If file was deleted from cache folder for some reason, re-generate it
            self.report_repo.remove(db, report_info["report_id"]) # Remove stale DB ref
            # Recreate
            report_info = self.get_or_create_report(db, prediction_id, user_id)
            file_path = report_info["pdf_path"]
            
        with open(file_path, "rb") as f:
            return f.read()
