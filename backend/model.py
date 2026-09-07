import pandas as pd
from sklearn.linear_model import LinearRegression
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "demand_history.csv"


def train_model(product_name):
    data = pd.read_csv(DATA_FILE)

    product_data = data[
        data["product_name"] == product_name
    ].copy()

    product_data["date"] = pd.to_datetime(product_data["date"])

    product_data["day"] = range(1, len(product_data) + 1)

    X = product_data[["day"]]
    y = product_data["demand"]

    model = LinearRegression()
    model.fit(X, y)

    return model, len(product_data)


def predict_demand(product_name, future_days=7):
    model, historical_days = train_model(product_name)

    future_day = historical_days + future_days

    prediction = model.predict(
    pd.DataFrame({"day": [future_day]})
)

    predicted_demand = round(float(prediction[0]), 2)

    return {
    "product_name": product_name,
    "forecast_days": future_days,
    "predicted_daily_demand": predicted_demand
}