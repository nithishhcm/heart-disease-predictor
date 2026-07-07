import json
import joblib
import warnings

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

from xgboost import XGBClassifier

from preprocess import (
    load_data,
    split_features_target,
    split_data,
    scale_data
)

warnings.filterwarnings("ignore")

# =====================================================
# Load Data
# =====================================================

print("=" * 60)
print("Loading Dataset...")
print("=" * 60)

df = load_data()

X, y = split_features_target(df)

X_train, X_test, y_train, y_test = split_data(X, y)

# Needed for Logistic Regression later
X_train_scaled, X_test_scaled, scaler = scale_data(X_train, X_test)

# =====================================================
# Random Forest Search Space
# =====================================================

rf_params = {

    "n_estimators": [100, 200, 300, 500],

    "max_depth": [None, 5, 10, 15, 20],

    "min_samples_split": [2, 5, 10],

    "min_samples_leaf": [1, 2, 4],

    "max_features": ["sqrt", "log2"]

}

# =====================================================
# XGBoost Search Space
# =====================================================

xgb_params = {

    "n_estimators": [100, 200, 300],

    "learning_rate": [0.01, 0.05, 0.1],

    "max_depth": [3, 4, 5, 6],

    "subsample": [0.8, 0.9, 1.0],

    "colsample_bytree": [0.8, 0.9, 1.0]

}

# =====================================================
# Models
# =====================================================

rf = RandomForestClassifier(
    random_state=42
)

xgb = XGBClassifier(
    random_state=42,
    eval_metric="logloss"
)

# =====================================================
# Random Forest Search
# =====================================================

print("\nSearching Best Random Forest...\n")

rf_search = RandomizedSearchCV(

    estimator=rf,

    param_distributions=rf_params,

    n_iter=20,

    cv=5,

    scoring="accuracy",

    random_state=42,

    n_jobs=-1

)

rf_search.fit(X_train, y_train)

# =====================================================
# XGBoost Search
# =====================================================

print("\nSearching Best XGBoost...\n")

xgb_search = RandomizedSearchCV(

    estimator=xgb,

    param_distributions=xgb_params,

    n_iter=20,

    cv=5,

    scoring="accuracy",

    random_state=42,

    n_jobs=-1

)

xgb_search.fit(X_train, y_train)

# =====================================================
# Evaluate
# =====================================================

models = {

    "Random Forest": rf_search.best_estimator_,

    "XGBoost": xgb_search.best_estimator_

}

best_model = None

best_name = None

best_accuracy = 0

best_params = {}

print("\n")

for name, model in models.items():

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    precision = precision_score(y_test, predictions)

    recall = recall_score(y_test, predictions)

    f1 = f1_score(y_test, predictions)

    print("=" * 60)

    print(name)

    print("=" * 60)

    print(f"Accuracy : {accuracy:.4f}")

    print(f"Precision: {precision:.4f}")

    print(f"Recall   : {recall:.4f}")

    print(f"F1 Score : {f1:.4f}")

    if accuracy > best_accuracy:

        best_accuracy = accuracy

        best_model = model

        best_name = name

        if name == "Random Forest":

            best_params = rf_search.best_params_

        else:

            best_params = xgb_search.best_params_

# =====================================================
# Save Best Model
# =====================================================

joblib.dump(best_model, "models/model.pkl")

joblib.dump(scaler, "models/scaler.pkl")

# =====================================================
# Save Best Parameters
# =====================================================

with open("results/best_params.json", "w") as f:

    json.dump(best_params, f, indent=4)

print("\n")

print("=" * 60)

print("BEST MODEL")

print("=" * 60)

print(best_name)

print(f"Accuracy : {best_accuracy:.4f}")

print("\nBest Parameters")

print(best_params)

print("\nSaved")

print("models/model.pkl")

print("results/best_params.json")