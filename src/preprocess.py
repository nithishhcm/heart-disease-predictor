import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def load_data(filepath="data/heart.csv"):
    """
    Load the heart disease dataset.
    """
    df = pd.read_csv(filepath)
    return df


def split_features_target(df):
    """
    Separate input features (X) and target (y).
    Invert target so 1 = High Risk (disease present), 0 = Low Risk (healthy).
    In raw dataset, 1 is healthy/normal and 0 is diseased.
    """
    X = df.drop("target", axis=1)
    y = 1 - df["target"]

    return X, y


def split_data(X, y, test_size=0.2, random_state=42):
    """
    Split dataset into training and testing sets.
    """

    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )


def scale_data(X_train, X_test):
    """
    Standardize numerical features.
    """

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)

    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, scaler