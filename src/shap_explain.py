import os
import joblib
import shap
import numpy as np
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

# Tree-based models (XGBoost / Random Forest)
explainer = shap.TreeExplainer(model)

# Compute SHAP values
shap_values = explainer.shap_values(X_test)

# =====================================================
# 1. GLOBAL EXPLANATION (Feature importance)
# =====================================================

print("Generating global feature importance plot...")

plt.figure()

shap.summary_plot(
    shap_values,
    X_test,
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

shap.force_plot(
    explainer.expected_value,
    shap_values[idx],
    X_test.iloc[idx],
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