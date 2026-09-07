import sqlite3

DATABASE_NAME = "inventory.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            category TEXT NOT NULL,
            current_stock REAL NOT NULL,
            daily_usage REAL NOT NULL,
            unit TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()