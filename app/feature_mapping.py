"""
Feature mapping module — converts numeric ML input features
into human-readable medical labels for display and reporting.
"""

# ─────────────────────────────────────────────
# Categorical label dictionaries
# ─────────────────────────────────────────────

SEX_MAP = {0: "Female", 1: "Male"}

CP_MAP = {
    0: "Typical Angina",
    1: "Atypical Angina",
    2: "Non-Anginal Pain",
    3: "Asymptomatic (Severe)",
}

FBS_MAP = {
    0: "Normal (≤120 mg/dL)",
    1: "Elevated (>120 mg/dL)",
}

RESTECG_MAP = {
    0: "Normal ECG",
    1: "ST-T Wave Abnormality",
    2: "Left Ventricular Hypertrophy",
}

EXANG_MAP = {
    0: "No Exercise-Induced Angina",
    1: "Exercise-Induced Angina Present",
}

SLOPE_MAP = {
    0: "Upsloping (Favorable)",
    1: "Flat (Borderline)",
    2: "Downsloping (Risk Indicator)",
}

CA_MAP = {
    0: "No Major Vessels Affected",
    1: "1 Major Vessel Affected",
    2: "2 Major Vessels Affected",
    3: "3 Major Vessels Affected",
    4: "4 Major Vessels Affected",
}

THAL_MAP = {
    0: "Normal Perfusion",
    1: "Fixed Defect",
    2: "Reversible Defect",
    3: "Severe Perfusion Defect",
}

# ─────────────────────────────────────────────
# Human-readable display labels for each field
# ─────────────────────────────────────────────

FIELD_LABELS = {
    "age":      "Age",
    "sex":      "Biological Sex",
    "cp":       "Chest Pain Type",
    "trestbps": "Resting Blood Pressure",
    "chol":     "Serum Cholesterol",
    "fbs":      "Fasting Blood Sugar",
    "restecg":  "Resting ECG Result",
    "thalach":  "Max Heart Rate Achieved",
    "exang":    "Exercise-Induced Angina",
    "oldpeak":  "ST Depression (Exercise)",
    "slope":    "Peak Exercise ST Slope",
    "ca":       "Fluoroscopy Major Vessels",
    "thal":     "Thalassemia",
}

FIELD_UNITS = {
    "age":      "years",
    "trestbps": "mmHg",
    "chol":     "mg/dL",
    "thalach":  "bpm",
    "oldpeak":  "mm",
}

# Master lookup for categorical maps
CATEGORICAL_MAPS = {
    "sex":     SEX_MAP,
    "cp":      CP_MAP,
    "fbs":     FBS_MAP,
    "restecg": RESTECG_MAP,
    "exang":   EXANG_MAP,
    "slope":   SLOPE_MAP,
    "ca":      CA_MAP,
    "thal":    THAL_MAP,
}

# ─────────────────────────────────────────────
# Conversion helpers
# ─────────────────────────────────────────────

def get_value_label(feature: str, value) -> str:
    """Return a human-readable label for any feature+value pair."""
    mapping = CATEGORICAL_MAPS.get(feature)
    if mapping is not None:
        return mapping.get(int(value), str(value))
    unit = FIELD_UNITS.get(feature, "")
    numeric = round(float(value), 2)
    return f"{numeric} {unit}".strip()


def humanize_profile(data: dict) -> dict:
    """
    Convert a raw numeric input dict into a fully human-readable
    patient profile dict keyed by display label.
    """
    return {
        FIELD_LABELS.get(feature, feature.upper()): get_value_label(feature, value)
        for feature, value in data.items()
    }


def get_feature_display_name(feature: str) -> str:
    """Return the display-friendly name for a raw feature key."""
    return FIELD_LABELS.get(feature, feature.upper())
