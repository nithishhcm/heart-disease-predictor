import time
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.predictor import predict
from app.explainer import explain
from app.feature_mapping import humanize_profile, get_feature_display_name, get_value_label
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.audit_repository import AuditRepository
from app.models import PredictionRecord
from app.schemas import ContributorDetail


# Medical advice mapping tables
DIAGNOSTIC_RANGES = {
    "trestbps": {"normal": "<120", "elevated": "120-129", "high_stage1": "130-139", "high_stage2": ">=140"},
    "chol": {"normal": "<200", "borderline": "200-239", "high": ">=240"},
    "thalach": {"normal": "60-100", "active_peak": "120-180"},
    "oldpeak": {"normal": "<0.5", "borderline": "0.5-1.5", "abnormal": ">1.5"}
}

class PredictionService:
    def __init__(self):
        self.pred_repo = PredictionRepository()
        self.audit_repo = AuditRepository()
        self.model_version = "ClinicalInference-LR-v2.1"
        self.ai_disclaimer = (
            "NEUROHEART AI is a clinical decision support system. Calculations are probabilistic "
            "and should not replace professional medical diagnosis, advice, or therapy."
        )

    def run_diagnostics(self, db: Session, user_id: int, data_dict: dict, ip_address: str = None) -> PredictionRecord:
        """Executes model inference, computes SHAP explanations, refines clinical details, and saves to database."""
        # 1. Run ML models
        pred, prob, scaled = predict(data_dict)
        
        # 2. Compute SHAP explanations
        explanation = explain(
            scaled_input=scaled,
            feature_names=list(data_dict.keys())
        )
        
        # 3. Assess clinical details
        risk_lvl = "High Risk" if pred == 1 else "Low Risk"
        conf_score = round(float(prob) * 100, 1) if pred == 1 else round((1 - float(prob)) * 100, 1)
        
        if prob > 0.75:
            severity = "Severe"
        elif prob > 0.5:
            severity = "Moderate"
        elif prob > 0.25:
            severity = "Mild"
        else:
            severity = "None"
            
        # 4. Save to Database
        record = PredictionRecord(
            user_id=user_id,
            input_data=data_dict,
            prediction=int(pred),
            probability=float(prob),
            explanation=explanation,
            risk_level=risk_lvl,
            confidence_score=conf_score,
            clinical_severity=severity,
            timestamp=datetime.utcnow()
        )
        saved_record = self.pred_repo.create(db, record)
        
        # Log event
        self.audit_repo.add_log(
            db, 
            action="PREDICT", 
            user_id=user_id, 
            ip_address=ip_address, 
            details=f"Generated cardiac risk evaluation (ID: {saved_record.id}). Risk Level: {risk_lvl} ({conf_score}%)."
        )
        
        return saved_record

    def build_clinical_response(self, record: PredictionRecord) -> dict:
        """Translates raw predictions and SHAP values into an expert-quality report payload."""
        data_dict = record.input_data
        shap_dict = record.explanation
        pred = record.prediction
        prob = record.probability
        
        # Calculate sum of absolute impact for percentages
        abs_sum = sum(abs(v) for v in shap_dict.values()) or 1.0
        
        risk_contributors = []
        protective_contributors = []
        
        # Sort factors by impact
        sorted_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        
        for feature, shap_val in sorted_factors:
            val_label = get_value_label(feature, data_dict[feature])
            disp_name = get_feature_display_name(feature)
            contrib_pct = round((abs(shap_val) / abs_sum) * 100, 1)
            
            # Clinical interpretation and severity evaluation
            item_severity = "Normal"
            clinical_interp = "Parameter within normal clinical tolerances."
            simple_exp = f"Your {disp_name.lower()} is positive for cardiovascular wellness."
            doc_exp = f"Physiological marker {feature} indicates stable homeostasis."
            
            # Feature-specific mapping
            if feature == "age":
                if data_dict[feature] > 65:
                    item_severity = "Moderate"
                    clinical_interp = "Advanced age increases natural vascular susceptibility."
                    simple_exp = "Age increases risk of cardiovascular disease naturally."
                    doc_exp = "Advanced chronological age is a prominent risk factor for arteriosclerosis."
            elif feature == "trestbps":
                if data_dict[feature] >= 140:
                    item_severity = "Severe"
                    clinical_interp = "Stage 2 Hypertension. Increases cardiac load."
                    simple_exp = f"High blood pressure ({val_label}) strains blood vessels."
                    doc_exp = f"Systolic pressure of {val_label} indicates arterial stiffness and high afterload."
                elif data_dict[feature] >= 130:
                    item_severity = "Moderate"
                    clinical_interp = "Stage 1 Hypertension."
                    simple_exp = "Blood pressure is slightly high."
                    doc_exp = "Stage 1 systolic hypertension increases vascular resistance."
            elif feature == "chol":
                if data_dict[feature] >= 240:
                    item_severity = "Severe"
                    clinical_interp = "Severe hypercholesterolemia. High atherosclerotic risk."
                    simple_exp = f"High cholesterol level ({val_label}) leads to plaque buildup."
                    doc_exp = "Serum lipids are highly elevated, predisposing to atheroma formation."
                elif data_dict[feature] >= 200:
                    item_severity = "Moderate"
                    clinical_interp = "Borderline hypercholesterolemia."
                    simple_exp = "Cholesterol is slightly elevated."
                    doc_exp = "Borderline hyperlipidemia requiring lipid-lowering intervention."
            elif feature == "ca":
                if data_dict[feature] > 0:
                    item_severity = "Severe"
                    clinical_interp = f"Fluoroscopy reveals {val_label} showing calcification."
                    simple_exp = "Presence of blocked major blood vessels restricts heart blood flow."
                    doc_exp = f"Positive fluoroscopic count of {data_dict[feature]} confirms coronary calcification."
            elif feature == "cp":
                if data_dict[feature] == 0:
                    item_severity = "Severe"
                    clinical_interp = "Typical Angina reported. Highly indicative of ischemia."
                    simple_exp = "Experiencing chest pain typical of reduced blood flow."
                    doc_exp = "Typical anginal symptoms represent myocardial oxygen supply-demand mismatch."
                elif data_dict[feature] in [1, 2]:
                    item_severity = "Moderate"
                    clinical_interp = "Non-anginal or atypical pain."
                    simple_exp = "Experiencing chest discomfort not typical of cardiac ischemia."
                    doc_exp = "Atypical chest discomfort requires differential testing."
            elif feature == "thalach":
                if data_dict[feature] < 120:
                    item_severity = "Moderate"
                    clinical_interp = "Chronotropic incompetence or low peak heart rate."
                    simple_exp = "Maximum heart rate achieved during exercise was lower than expected."
                    doc_exp = "Low peak heart rate represents bradycardic tendencies or sinus nodes limits."
            elif feature == "exang":
                if data_dict[feature] == 1:
                    item_severity = "Severe"
                    clinical_interp = "Exercise-induced angina confirms myocardial ischemia under stress."
                    simple_exp = "Chest pain triggered by exercise confirms heart strain."
                    doc_exp = "Angina during stress test confirms cardiac arterial perfusion deficits."
            elif feature == "oldpeak":
                if data_dict[feature] > 1.5:
                    item_severity = "Severe"
                    clinical_interp = f"Significant ST depression ({val_label}) indicating ischemia."
                    simple_exp = "Exercise stress test shows indicators of oxygen deprivation in the heart."
                    doc_exp = f"ST segment depression of {val_label} represents subendocardial myocardial ischemia."
            elif feature == "thal":
                if data_dict[feature] == 3:
                    item_severity = "Severe"
                    clinical_interp = "Severe thalassemia/reversible perfusion defect."
                    simple_exp = "Thalassemia blood markers show signs of severe oxygen transportation issues."
                    doc_exp = "Thalassemia code 3 indicates dynamic perfusion deficiencies."
            
            detail = ContributorDetail(
                feature=feature,
                label=disp_name,
                value=val_label,
                impact=float(shap_val),
                contribution_percentage=contrib_pct,
                severity=item_severity,
                clinical_interpretation=clinical_interp,
                simple_explanation=simple_exp,
                doctor_explanation=doc_exp
            )
            
            if shap_val > 0:
                risk_contributors.append(detail)
            else:
                detail.severity = "Favorable" if detail.severity in ["Normal", "Mild"] else "Highly Favorable"
                protective_contributors.append(detail)
                
        # 5. Compile Advice and Recommendations
        lifestyle = [
            "Maintain a low-sodium, high-fiber cardiovascular diet (DASH diet framework).",
            "Engage in moderate-intensity aerobic exercise (e.g., brisk walking 150 minutes/week)."
        ]
        immediate = []
        med_tests = ["Standard 12-lead Electrocardiogram (ECG)", "Complete Fasting Lipid Panel"]
        specialists = ["Primary Care Physician (PCP)"]
        
        if pred == 1:
            # High risk
            lifestyle.append("Complete cessation of any nicotine consumption.")
            lifestyle.append("Reduce alcohol intake to fewer than 1 standard drink daily.")
            immediate.append("Schedule a comprehensive cardiac stress evaluation.")
            immediate.append("Monitor blood pressure twice daily (morning/evening).")
            med_tests.extend(["Stress Echocardiography", "Coronary Computed Tomography Angiography (CCTA)"])
            specialists.extend(["Board-certified Cardiologist", "Registered Dietitian (RD)"])
            timeline = "Within 48 to 72 hours"
        else:
            # Low risk
            lifestyle.append("Maintain restful sleep patterns (7-9 hours/night).")
            immediate.append("Continue routine cardiovascular vitals tracking.")
            med_tests.append("Routine annual metabolic and lipid screening.")
            timeline = "Routine annual physical exam"
            
        # Add high cholesterol specific tests
        if data_dict["chol"] >= 240:
            med_tests.append("Lipoprotein(a) and ApoB screening.")
            
        # Legacy V2 risk lists compatibility
        legacy_risk = [f"{c.severity} elevated risk due to {c.label}" for c in risk_contributors[:3]]
        legacy_prot = [f"{c.label} has a protective effect" for c in protective_contributors[:3]]
        
        # Build patient summary text
        patient_summary = (
            f"Diagnostics reveal a {record.risk_level.lower()} profile ({record.confidence_score}% confidence). "
        )

        if pred == 1:
            top_risk = [c.label.lower() for c in risk_contributors[:2]]
            patient_summary += f"The profile is primary driven by {', '.join(top_risk)}. Seeking physician guidance is recommended."
        else:
            top_prot = [c.label.lower() for c in protective_contributors[:2]]
            patient_summary += f"Cardiovascular indicators remain stabilized, supported by {', '.join(top_prot)}."
            
        return {
            "prediction": record.prediction,
            "probability": record.probability,
            "prediction_id": record.id,
            "prediction_timestamp": record.timestamp,
            "risk_level": record.risk_level,
            "confidence_score": record.confidence_score,
            "clinical_severity": record.clinical_severity,
            "patient_summary": patient_summary,
            "medical_interpretation": (
                "Myocardial ischemia markers are positive. Significant arterial vessel calcification is suspected."
                if pred == 1 else "Normal cardiac functional output. Vitals represent healthy homeostasis."
            ),
            "risk_contributors": risk_contributors,
            "protective_contributors": protective_contributors,
            "lifestyle_recommendations": lifestyle,
            "immediate_recommendations": immediate,
            "recommended_medical_tests": med_tests,
            "recommended_specialists": specialists,
            "follow_up_timeline": timeline,
            "ai_disclaimer": self.ai_disclaimer,
            "model_version": self.model_version,
            
            # Compatibility properties
            "patient_profile": humanize_profile(data_dict),
            "risk_factors": {
                "high_risk": legacy_risk,
                "protective_factors": legacy_prot
            },
            "shap_values_raw": shap_dict,
            "medical_summary": patient_summary
        }
