import os
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from preprocess import (
    load_data,
    split_features_target,
    split_data,
    scale_data
)

# --------------------------
# Load dataset
# --------------------------

df = load_data()

X, y = split_features_target(df)

X_train, X_test, y_train, y_test = split_data(X, y)

X_train_scaled, X_test_scaled, scaler = scale_data(X_train, X_test)

# --------------------------
# Train Model
# --------------------------

model = LogisticRegression(random_state=42)

model.fit(X_train_scaled, y_train)

# --------------------------
# Predictions
# --------------------------

y_pred = model.predict(X_test_scaled)

# --------------------------
# Evaluation
# --------------------------

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("=" * 60)
print("Logistic Regression Results")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nConfusion Matrix")

print(confusion_matrix(y_test, y_pred))

print("\nClassification Report")

print(classification_report(y_test, y_pred))

# --------------------------
# Save Model
# --------------------------

os.makedirs("models", exist_ok=True)

joblib.dump(model, "models/logistic_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

print("\nModel saved successfully!")