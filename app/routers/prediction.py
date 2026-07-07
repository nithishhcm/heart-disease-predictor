import io
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, check_rate_limit
from app.schemas import PatientData, PredictionResponseV2, PredictionHistory
from app.services.prediction_service import PredictionService
from app.services.report_service import ReportService
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.audit_repository import AuditRepository
from app.models import User

router = APIRouter(tags=["Diagnostics & Predictions"])
pred_service = PredictionService()
report_service = ReportService()
pred_repo = PredictionRepository()
audit_repo = AuditRepository()

@router.post("/predict", response_model=PredictionResponseV2,
             description="Submit patient vitals and symptoms to execute neural network inference. "
                         "Returns a comprehensive report detailing cardiovascular risk level, contributors, and treatment paths.",
             summary="Run Cardiac Diagnostics")
def predict_api(
    data: PatientData, 
    request: Request,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    _ = Depends(check_rate_limit)
):
    ip_addr = request.client.host if request.client else None
    
    # 1. Run inference and save prediction
    record = pred_service.run_diagnostics(db, current_user.id, data.dict(), ip_address=ip_addr)
    
    # 2. Build full response payload
    return pred_service.build_clinical_response(record)

@router.get("/history", response_model=List[PredictionHistory],
             description="Retrieve past cardiac diagnostic records. Supports filtering by risk category, searching clinical notes, and pagination.",
             summary="Retrieve History")
def get_user_history(
    skip: int = 0,
    limit: int = 100,
    risk_level: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc",
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    records, _ = pred_repo.get_user_history_paginated(
        db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit, 
        risk_level=risk_level, 
        sort_by=sort_by, 
        sort_order=sort_order, 
        search=search
    )
    return records

@router.delete("/prediction/{prediction_id}", status_code=status.HTTP_200_OK,
             description="Permanently delete a diagnostic prediction record and its associated cached reports.",
             summary="Delete Diagnostic Record")
def delete_prediction(
    prediction_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = pred_repo.get(db, prediction_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        
    if record.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    pred_repo.remove(db, prediction_id)
    
    # Log audit
    ip_addr = request.client.host if request.client else None
    audit_repo.add_log(
        db, 
        action="DELETE_PREDICTION", 
        user_id=current_user.id, 
        ip_address=ip_addr, 
        details=f"Deleted prediction record ID: {prediction_id}"
    )
    
    return {"detail": "Record deleted successfully"}

@router.get("/prediction/{prediction_id}/report/download",
             description="Generates and streams a professional clinical-grade PDF report including diagnostic indicators, and doctor sign-off blocks.",
             summary="Download PDF Report")
def download_pdf_report(
    prediction_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Construct base URL for verification QR codes
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    
    # Trigger generation
    report_service.get_or_create_report(db, prediction_id, current_user.id, host_url=base_url)
    pdf_data = report_service.get_pdf_bytes(db, prediction_id, current_user.id)
    
    # Set headers to download file
    headers = {
        "Content-Disposition": f"attachment; filename=cardio_report_{prediction_id}.pdf"
    }
    
    return StreamingResponse(io.BytesIO(pdf_data), media_type="application/pdf", headers=headers)

@router.get("/prediction/{prediction_id}/report/verify",
             description="Public anchor to check the clinical validity of a printed cardiovascular sheet.",
             summary="Verify Printed Report")
def verify_report(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    record = pred_repo.get(db, prediction_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnostic signature not found in database.")
        
    return {
        "status": "Verified",
        "message": "This report signature matches an authentic NeuroHeart AI diagnostic record.",
        "record_id": record.id,
        "timestamp": record.timestamp,
        "risk_level": record.risk_level,
        "confidence_score": record.confidence_score,
        "clinical_severity": record.clinical_severity,
        "model_version": pred_service.model_version
    }

