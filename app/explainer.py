import shap
import pandas as pd
from app.model_loader import model, scaler

# Initialize explainer dynamically based on model type
try:
    if hasattr(model, "coef_"):
        # Linear model (Logistic Regression)
        df_bg = pd.read_csv("data/heart.csv").drop("target", axis=1)
        bg_scaled = scaler.transform(df_bg)
        explainer = shap.LinearExplainer(model, bg_scaled)
    else:
        # Tree model
        explainer = shap.TreeExplainer(model)
except Exception:
    explainer = None

def explain(scaled_input, feature_names):
    vals = None
    if explainer is not None:
        try:
            shap_values = explainer.shap_values(scaled_input)

            # Normalize SHAP values: extract positive class (class 1) if binary classification,
            # and select the first sample since scaled_input has 1 row.
            if isinstance(shap_values, (list, tuple)):
                if len(shap_values) == 2:
                    arr = shap_values[1]
                else:
                    arr = shap_values[0]
            else:
                arr = shap_values

            if arr.ndim == 3:
                if arr.shape[2] == 2:
                    arr = arr[:, :, 1]
                else:
                    arr = arr[:, :, 0]

            if arr.ndim == 2:
                vals = arr[0]
            else:
                vals = arr
        except Exception:
            vals = None

    if vals is None:
        # Fallback manual calculation for linear model
        if hasattr(model, "coef_"):
            coefs = model.coef_[0]
            row = scaled_input[0]
            vals = coefs * row
        else:
            vals = [0.0] * len(feature_names)

    explanation = {}
    for i, f in enumerate(feature_names):
        explanation[f] = float(vals[i])

    return explanation