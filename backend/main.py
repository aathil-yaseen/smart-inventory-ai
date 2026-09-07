from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import create_table, get_connection
from backend.model import predict_demand

app = FastAPI(
    title="Smart Inventory AI",
    description="AI-powered inventory demand forecasting system",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5501",
        "http://localhost:5501"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


create_table()


@app.get("/")
def home():
    return {
        "message": "Smart Inventory AI API is running!"
    }

from fastapi import HTTPException
@app.post("/inventory")
def add_product(
    product_name: str,
    category: str,
    current_stock: float,
    daily_usage: float,
    unit: str
):
    connection = get_connection()

    cursor = connection.execute(
        """
        INSERT INTO inventory
        (product_name, category, current_stock, daily_usage, unit)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            product_name,
            category,
            current_stock,
            daily_usage,
            unit
        )
    )

    connection.commit()

    product_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Product added successfully",
        "product_id": product_id
    }
@app.get("/inventory")
def get_inventory():
    connection = get_connection()

    products = connection.execute(
        "SELECT * FROM inventory"
    ).fetchall()

    connection.close()

    return [dict(product) for product in products]
@app.get("/inventory/{product_id}/stock-status")
def get_stock_status(product_id: int):
    connection = get_connection()

    product = connection.execute(
        "SELECT * FROM inventory WHERE id = ?",
        (product_id,)
    ).fetchone()

    connection.close()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    current_stock = product["current_stock"]
    daily_usage = product["daily_usage"]

    if daily_usage <= 0:
        days_remaining = None
    else:
        days_remaining = round(current_stock / daily_usage, 2)

    if days_remaining is None:
        status = "NO USAGE DATA"
    elif days_remaining <= 3:
        status = "CRITICAL"
    elif days_remaining <= 7:
        status = "LOW"
    else:
        status = "HEALTHY"

    return {
        "product_name": product["product_name"],
        "current_stock": current_stock,
        "daily_usage": daily_usage,
        "days_remaining": days_remaining,
        "status": status
    }
@app.delete("/inventory/{product_id}")
def delete_product(product_id: int):
    connection = get_connection()

    product = connection.execute(
        "SELECT * FROM inventory WHERE id = ?",
        (product_id,)
    ).fetchone()

    if product is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    connection.execute(
        "DELETE FROM inventory WHERE id = ?",
        (product_id,)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Product deleted successfully",
        "product_id": product_id
    }

@app.put("/inventory/{product_id}")
def update_product(
    product_id: int,
    product_name: str,
    category: str,
    current_stock: float,
    daily_usage: float,
    unit: str
):
    connection = get_connection()

    product = connection.execute(
        "SELECT * FROM inventory WHERE id = ?",
        (product_id,)
    ).fetchone()

    if product is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    connection.execute(
        """
        UPDATE inventory
        SET product_name = ?,
            category = ?,
            current_stock = ?,
            daily_usage = ?,
            unit = ?
        WHERE id = ?
        """,
        (
            product_name,
            category,
            current_stock,
            daily_usage,
            unit,
            product_id
        )
    )

    connection.commit()
    connection.close()

    return {
        "message": "Product updated successfully",
        "product_id": product_id
    }
@app.get("/inventory/stock-analysis")
def stock_analysis():
    connection = get_connection()

    products = connection.execute(
        "SELECT * FROM inventory"
    ).fetchall()

    connection.close()

    results = []

    for product in products:
        current_stock = product["current_stock"]
        daily_usage = product["daily_usage"]

        if daily_usage <= 0:
            days_remaining = None
            status = "NO USAGE DATA"

        else:
            days_remaining = round(
                current_stock / daily_usage, 2
            )

            if days_remaining <= 3:
                status = "CRITICAL"
            elif days_remaining <= 7:
                status = "LOW"
            else:
                status = "HEALTHY"

        results.append({
            "id": product["id"],
            "product_name": product["product_name"],
            "current_stock": current_stock,
            "daily_usage": daily_usage,
            "unit": product["unit"],
            "days_remaining": days_remaining,
            "status": status
        })

    return results

@app.get("/inventory/{product_name}/forecast")
def demand_forecast(product_name: str, days: int = 7):

    try:
        result = predict_demand(product_name, days)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/inventory/{product_id}/smart-recommendation")
def smart_recommendation(product_id: int, forecast_days: int = 7):

    connection = get_connection()

    product = connection.execute(
        "SELECT * FROM inventory WHERE id = ?",
        (product_id,)
    ).fetchone()

    connection.close()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    current_stock = product["current_stock"]

    forecast = predict_demand(
        product["product_name"],
        forecast_days
    )

    predicted_daily_demand = forecast["predicted_daily_demand"]

    if predicted_daily_demand <= 0:
        days_until_stockout = None
        risk = "NO DEMAND"
        recommended_reorder = 0

    else:
        days_until_stockout = round(
            current_stock / predicted_daily_demand, 2
        )

        total_forecast_demand = round(
            predicted_daily_demand * forecast_days, 2
        )

        safety_stock = round(
            predicted_daily_demand * 3, 2
        )

        required_stock = (
            total_forecast_demand + safety_stock
        )

        recommended_reorder = max(
            0,
            round(required_stock - current_stock, 2)
        )

        if days_until_stockout <= 3:
            risk = "HIGH"
        elif days_until_stockout <= 7:
            risk = "MEDIUM"
        else:
            risk = "LOW"

    return {
        "product_id": product["id"],
        "product_name": product["product_name"],
        "current_stock": current_stock,
        "unit": product["unit"],
        "forecast_days": forecast_days,
        "predicted_daily_demand": predicted_daily_demand,
        "days_until_stockout": days_until_stockout,
        "stockout_risk": risk,
        "recommended_reorder": recommended_reorder
    }
@app.get("/inventory/smart-recommendations")
def all_smart_recommendations():

    connection = get_connection()

    products = connection.execute(
        "SELECT * FROM inventory"
    ).fetchall()

    connection.close()

    recommendations = []

    for product in products:

        current_stock = product["current_stock"]

        try:
            forecast = predict_demand(
                product["product_name"],
                7
            )

            predicted_daily_demand = forecast["predicted_daily_demand"]

            if predicted_daily_demand <= 0:
                risk = "NO DEMAND"
                recommended_reorder = 0
                days_until_stockout = None

            else:
                days_until_stockout = round(
                    current_stock / predicted_daily_demand,
                    2
                )

                total_forecast_demand = round(
                    predicted_daily_demand * 7,
                    2
                )

                safety_stock = round(
                    predicted_daily_demand * 3,
                    2
                )

                required_stock = (
                    total_forecast_demand + safety_stock
                )

                recommended_reorder = max(
                    0,
                    round(required_stock - current_stock, 2)
                )

                if days_until_stockout <= 3:
                    risk = "HIGH"
                elif days_until_stockout <= 7:
                    risk = "MEDIUM"
                else:
                    risk = "LOW"

            recommendations.append({
                "product_id": product["id"],
                "product_name": product["product_name"],
                "category": product["category"],
                "current_stock": current_stock,
                "unit": product["unit"],
                "predicted_daily_demand": predicted_daily_demand,
                "days_until_stockout": days_until_stockout,
                "stockout_risk": risk,
                "recommended_reorder": recommended_reorder
            })

        except Exception:
            recommendations.append({
                "product_id": product["id"],
                "product_name": product["product_name"],
                "stockout_risk": "NO FORECAST DATA"
            })

    return recommendations