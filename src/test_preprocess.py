from preprocess import (
    load_data,
    split_features_target,
    split_data,
    scale_data
)

# Load data
df = load_data()

# Split features and target
X, y = split_features_target(df)

# Train-test split
X_train, X_test, y_train, y_test = split_data(X, y)

# Scale
X_train_scaled, X_test_scaled, scaler = scale_data(X_train, X_test)

print("=" * 60)
print("Training Shape:", X_train_scaled.shape)
print("Testing Shape :", X_test_scaled.shape)
print("=" * 60)

print("Scaler Created Successfully!")