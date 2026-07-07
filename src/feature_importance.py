import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt

from preprocess import (
    load_data,
    split_features_target
)

# =====================================================
# Create plots folder
# =====================================================

os.makedirs("plots", exist_ok=True)

# =====================================================
# Load Dataset
# =====================================================

print("=" * 60)
print("Loading Dataset...")
print("=" * 60)

df = load_data()

X, y = split_features_target(df)

# =====================================================
# Load Best Model
# =====================================================

print("Loading Best Model...\n")

model = joblib.load("models/model.pkl")

# =====================================================
# Get Feature Importance
# =====================================================

importance = model.feature_importances_

importance_df = pd.DataFrame({

    "Feature": X.columns,

    "Importance": importance

})

importance_df = importance_df.sort_values(
    by="Importance",
    ascending=False
)

print("=" * 60)
print("Feature Importance")
print("=" * 60)

print(importance_df)

# =====================================================
# Plot
# =====================================================

plt.figure(figsize=(10,6))

plt.barh(
    importance_df["Feature"],
    importance_df["Importance"]
)

plt.xlabel("Importance")

plt.ylabel("Feature")

plt.title("Feature Importance (XGBoost)")

plt.gca().invert_yaxis()

plt.tight_layout()

plt.savefig(
    "plots/feature_importance.png",
    dpi=300
)

plt.show()

print("\nSaved: plots/feature_importance.png")