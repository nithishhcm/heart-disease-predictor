import pandas as pd

# Load dataset
df = pd.read_csv("data/heart.csv")

# ----------------------------
# Basic Information
# ----------------------------
print("=" * 60)
print("Dataset Shape")
print("=" * 60)
print(df.shape)

print("\n")

print("=" * 60)
print("First 5 Rows")
print("=" * 60)
print(df.head())

print("\n")

print("=" * 60)
print("Dataset Information")
print("=" * 60)
print(df.info())

print("\n")

print("=" * 60)
print("Missing Values")
print("=" * 60)
print(df.isnull().sum())

print("\n")

print("=" * 60)
print("Statistical Summary")
print("=" * 60)
print(df.describe())

print("\n")

print("=" * 60)
print("Target Distribution")
print("=" * 60)
print(df["target"].value_counts())