"""
Builds the structured API response, translating raw ML predictions and SHAP values
into human-readable medical summaries and insights.
"""
from app.feature_mapping import humanize_profile, get_feature_display_name

def build_risk_factors(shap_dict: dict) -> dict:
    """
    Split SHAP values into high-risk (positive) and protective (negative) factors.
    Returns lists of human-readable strings.
    """
    high_risk = []
    protective = []
    
    # Sort by absolute impact
    sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    
    for feature, shap_val in sorted_features:
        if abs(shap_val) < 0.01:
            continue # Skip negligible factors
            
        display_name = get_feature_display_name(feature)
        impact = abs(shap_val)
        
        # Determine magnitude adjective
        if impact > 0.8:
            magnitude = "Strongly"
        elif impact > 0.3:
            magnitude = "Moderately"
        else:
            magnitude = "Slightly"
            
        if shap_val > 0:
            high_risk.append(f"{magnitude} elevated risk due to {display_name}")
        else:
            protective.append(f"{display_name} has a {magnitude.lower()} protective effect")
            
    return {
        "high_risk": high_risk,
        "protective_factors": protective
    }

def build_medical_summary(prediction: int, probability: float, high_risk: list, protective: list) -> str:
    """Generate a natural-language medical summary."""
    risk_level = "High" if prediction == 1 else "Low"
    prob_pct = round(probability * 100, 1)
    
    summary = f"Patient presents a {risk_level} risk profile for heart disease (Probability: {prob_pct}%). "
    
    if prediction == 1:
        if high_risk:
            # Take top 2 high risk factors
            top_factors = [f.split("due to ")[-1] for f in high_risk[:2]]
            summary += f"The elevated risk is primarily driven by {', '.join(top_factors)}. "
        summary += "Immediate medical consultation and further diagnostic testing are highly recommended."
    else:
        if protective:
             top_protective = [f.split(" has ")[0] for f in protective[:2]]
             summary += f"Risk is currently mitigated by favorable factors including {', '.join(top_protective)}. "
        summary += "Routine cardiovascular monitoring should be maintained."
        
    return summary

def build_full_response(prediction: int, probability: float, input_data: dict, shap_dict: dict) -> dict:
    """Assemble the complete V2 JSON response."""
    patient_profile = humanize_profile(input_data)
    risk_factors = build_risk_factors(shap_dict)
    medical_summary = build_medical_summary(
        prediction, 
        probability, 
        risk_factors["high_risk"], 
        risk_factors["protective_factors"]
    )
    
    return {
        "prediction": prediction,
        "probability": probability,
        "patient_profile": patient_profile,
        "risk_factors": risk_factors,
        "shap_values_raw": shap_dict,
        "medical_summary": medical_summary
    }
