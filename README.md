# Smart Inventory AI

> AI-powered inventory intelligence platform for demand forecasting, stockout risk prediction, and smart reorder recommendations.

Smart Inventory AI is a full-stack application that combines software engineering, REST API development, database management, data analysis, and machine learning to help businesses monitor inventory and make data-driven replenishment decisions.

The system analyzes inventory and historical demand data, forecasts future demand, estimates stockout risk, and provides actionable reorder recommendations through an interactive web dashboard.

---

## 🚀 Key Features

### 📦 Inventory Management

- Add new products
- Edit existing products
- Delete products
- View inventory records
- Search and filter products
- Track stock quantity, category, unit, and daily usage

### 🤖 AI & Machine Learning

- Historical demand analysis
- Product-level demand forecasting
- Future demand estimation using Scikit-learn
- Stockout risk prediction
- Estimated days until stockout
- AI-assisted reorder recommendations

### 📊 Business Intelligence

- Inventory health monitoring
- High and medium stockout risk identification
- Predicted daily demand analysis
- Recommended reorder quantity
- Automated inventory insights

### 🌐 Full-Stack Application

- FastAPI REST backend
- SQLite database
- Interactive web dashboard
- JavaScript-based frontend
- Chart.js data visualization
- Frontend-backend API integration

---

## 🧠 System Workflow

```text
                    ┌─────────────────────┐
                    │    Web Dashboard    │
                    │  HTML/CSS/JS/Chart  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI REST API │
                    │   Backend Services  │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          ┌─────────────────┐   ┌─────────────────┐
          │ SQLite Database │   │ Historical Data │
          │ Inventory Data  │   │ Demand Data     │
          └────────┬────────┘   └────────┬────────┘
                   │                     │
                   └──────────┬──────────┘
                              ▼
                   ┌─────────────────────┐
                   │ ML Demand Forecast  │
                   │ Scikit-learn Model  │
                   └──────────┬──────────┘
                              ▼
                   ┌─────────────────────┐
                   │ Stockout Risk       │
                   │ Analysis            │
                   └──────────┬──────────┘
                              ▼
                   ┌─────────────────────┐
                   │ Reorder             │
                   │ Recommendation      │
                   └──────────┬──────────┘
                              ▼
                   ┌─────────────────────┐
                   │ Actionable Insights │
                   │ on Dashboard        │
                   └─────────────────────┘