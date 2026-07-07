import os
import json
import time
import joblib
import warnings

import matplotlib.pyplot as plt
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    ConfusionMatrixDisplay
)

from sklearn.model_selection import cross_val_score

from preprocess import (
    load_data,
    split_features_target,
    split_data,
    scale_data
)

warnings.filterwarnings("ignore")

# =====================================================
# Create folders
# =====================================================

os.makedirs("results", exist_ok=True)
os.makedirs("results/confusion_matrices", exist_ok=True)
os.makedirs("results/roc_curves", exist_ok=True)
os.makedirs("models", exist_ok=True)

# =====================================================
# Load Dataset
# =====================================================

print("=" * 60)
print("Loading Dataset...")
print("=" * 60)

df = load_data()

X, y = split_features_target(df)

X_train, X_test, y_train, y_test = split_data(X, y)

X_train_scaled, X_test_scaled, scaler = scale_data(X_train, X_test)

# =====================================================
# Models
# =====================================================

models = {
    "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000),

    "Decision Tree": DecisionTreeClassifier(
        random_state=42
    ),

    "Random Forest": RandomForestClassifier(
        random_state=42,
        n_estimators=200
    ),

    "XGBoost": XGBClassifier(
        random_state=42,
        n_estimators=200,
        learning_rate=0.05,
        max_depth=4,
        eval_metric="logloss"
    )
}

# =====================================================
# Evaluation
# =====================================================

results = []

metrics_json = {}

best_model = None
best_model_name = None
best_accuracy = 0

plt.figure(figsize=(8,6))

print("\nTraining Models...\n")

for name, model in models.items():

    print(f"Training {name}...")

    start = time.time()

    if name == "Logistic Regression":

        model.fit(X_train_scaled, y_train)

        predictions = model.predict(X_test_scaled)

        probabilities = model.predict_proba(X_test_scaled)[:,1]

        cv = cross_val_score(
            model,
            X_train_scaled,
            y_train,
            cv=5,
            scoring="accuracy"
        )

    else:

        model.fit(X_train, y_train)

        predictions = model.predict(X_test)

        probabilities = model.predict_proba(X_test)[:,1]

        cv = cross_val_score(
            model,
            X_train,
            y_train,
            cv=5,
            scoring="accuracy"
        )

    training_time = time.time() - start

    accuracy = accuracy_score(y_test, predictions)

    precision = precision_score(y_test, predictions)

    recall = recall_score(y_test, predictions)

    f1 = f1_score(y_test, predictions)

    roc_auc = roc_auc_score(y_test, probabilities)

    cv_mean = cv.mean()

    # --------------------------------------
    # Save Results
    # --------------------------------------

    results.append({

        "Model": name,

        "Accuracy": round(accuracy,4),

        "Precision": round(precision,4),

        "Recall": round(recall,4),

        "F1 Score": round(f1,4),

        "ROC AUC": round(roc_auc,4),

        "CV Accuracy": round(cv_mean,4),

        "Training Time (s)": round(training_time,4)

    })

    metrics_json[name] = {

        "Accuracy": accuracy,

        "Precision": precision,

        "Recall": recall,

        "F1 Score": f1,

        "ROC AUC": roc_auc,

        "Cross Validation": cv_mean,

        "Training Time": training_time

    }

    # --------------------------------------
    # Confusion Matrix
    # --------------------------------------

    cm = confusion_matrix(y_test, predictions)

    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm
    )

    disp.plot()

    plt.title(name)

    plt.savefig(
        f"results/confusion_matrices/{name.replace(' ','_')}.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    # --------------------------------------
    # ROC Curve
    # --------------------------------------

    fpr, tpr, _ = roc_curve(
        y_test,
        probabilities
    )

    plt.plot(
        fpr,
        tpr,
        linewidth=2,
        label=f"{name} ({roc_auc:.3f})"
    )

    # --------------------------------------
    # Save Best Model
    # --------------------------------------

    if accuracy > best_accuracy:

        best_accuracy = accuracy

        best_model = model

        best_model_name = name

# =====================================================
# Finish ROC Curve
# =====================================================

plt.plot([0,1],[0,1],'k--')

plt.xlabel("False Positive Rate")

plt.ylabel("True Positive Rate")

plt.title("ROC Curve Comparison")

plt.legend()

plt.savefig(
    "results/roc_curves/roc_curve.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# Save CSV
# =====================================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="Accuracy",
    ascending=False
)

results_df.to_csv(
    "results/model_comparison.csv",
    index=False
)

# =====================================================
# Save JSON
# =====================================================

with open("results/metrics.json","w") as f:

    json.dump(
        metrics_json,
        f,
        indent=4
    )

# =====================================================
# Save Best Model
# =====================================================

joblib.dump(
    best_model,
    "models/model.pkl"
)

joblib.dump(
    scaler,
    "models/scaler.pkl"
)

# =====================================================
# Print Results
# =====================================================

print("\n")
print("="*80)
print("MODEL COMPARISON")
print("="*80)

print(results_df)

print("\n")
print("="*80)
print(f"Best Model : {best_model_name}")
print(f"Accuracy   : {best_accuracy:.4f}")
print("="*80)

print("\nResults saved successfully!")

print("results/model_comparison.csv")

print("results/metrics.json")

print("results/confusion_matrices/")

print("results/roc_curves/")

print("models/model.pkl")

print("models/scaler.pkl")