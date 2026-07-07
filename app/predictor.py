import pandas as pd
from app.model_loader import model, scaler

def predict(data):

    df = pd.DataFrame([data])

    scaled = scaler.transform(df)

    pred = model.predict(scaled)[0]
    prob = model.predict_proba(scaled)[0][1]

    return pred, prob, scaled