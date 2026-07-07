import os
import joblib
import shap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from preprocess import (
    load_data,
    split_features_target,
    split_data,
    scale_data
)

# =====================================================
# Create folder
# =====================================================

os.makedirs("plots/shap", exist_ok=True)

# =====================================================
# Load data
# =====================================================

print("=" * 60)
print("Loading dataset...")
print("=" * 60)

df = load_data()

X, y = split_features_target(df)

X_train, X_test, y_train, y_test = split_data(X, y)

X_train_scaled, X_test_scaled, scaler = scale_data(X_train, X_test)

# =====================================================
# Load trained model
# =====================================================

print("Loading model...")

model = joblib.load("models/model.pkl")

# =====================================================
# SHAP Explainer
# =====================================================

print("Creating SHAP explainer...")

# Initialize explainer dynamically based on model type
if hasattr(model, "coef_"):
    # Linear model (Logistic Regression)
    explainer = shap.LinearExplainer(model, X_train_scaled)
    X_test_explain = X_test_scaled
    shap_values = explainer.shap_values(X_test_scaled)
    shap_plot_values = shap_values
    expected_val = explainer.expected_value
else:
    # Tree model
    explainer = shap.TreeExplainer(model)
    X_test_explain = X_test
    shap_values = explainer.shap_values(X_test)
    
    # Normalize SHAP values for tree models (extract class 1 if binary)
    if isinstance(shap_values, (list, tuple)):
        if len(shap_values) == 2:
            shap_plot_values = shap_values[1]
            expected_val = explainer.expected_value[1] if hasattr(explainer, "expected_value") else 0.5
        else:
            shap_plot_values = shap_values[0]
            expected_val = explainer.expected_value[0] if hasattr(explainer, "expected_value") else 0.5
    elif shap_values.ndim == 3 and shap_values.shape[2] == 2:
        shap_plot_values = shap_values[:, :, 1]
        expected_val = explainer.expected_value[1] if hasattr(explainer, "expected_value") else 0.5
    else:
        shap_plot_values = shap_values
        expected_val = explainer.expected_value if hasattr(explainer, "expected_value") else 0.5

# =====================================================
# 1. GLOBAL EXPLANATION (Feature importance)
# =====================================================

print("Generating global feature importance plot...")

plt.figure()

shap.summary_plot(
    shap_plot_values,
    X_test_explain,
    show=False
)

plt.savefig(
    "plots/shap/shap_summary.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# 2. LOCAL EXPLANATION (Single prediction)
# =====================================================

print("Generating local explanation for 1 sample...")

idx = 0  # you can change this for different patients

# Format the sample values appropriately
if isinstance(X_test_explain, pd.DataFrame):
    sample_features = X_test_explain.iloc[idx]
else:
    # For numpy array, map it to a Series with feature names so plot labels show correctly
    sample_features = pd.Series(X_test_explain[idx], index=X_test.columns)

shap.force_plot(
    expected_val,
    shap_plot_values[idx],
    sample_features,
    matplotlib=True,
    show=False
)

plt.savefig(
    "plots/shap/shap_force_plot.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# DONE
# =====================================================

print("\n" + "=" * 60)
print("SHAP COMPLETED")
print("=" * 60)

print("Saved files:")

print("plots/shap/shap_summary.png")
print("plots/shap/shap_force_plot.png")