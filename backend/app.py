import csv
import os
import sqlite3
from flask import Flask, jsonify, send_from_directory, request

app = Flask(__name__, static_folder="../frontend", static_url_path="")

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "bawangchaji_sales.csv")
DB_PATH = os.path.join(os.path.dirname(__file__), "bawangchaji.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS sales")
    cur.execute(
        """
        CREATE TABLE sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT, city TEXT, store_id TEXT, product TEXT,
            category TEXT, unit_price REAL, quantity INTEGER,
            discount REAL, revenue REAL, member_pct REAL,
            weather TEXT, season TEXT, is_holiday TEXT, campaign TEXT
        )
        """
    )

    with open(DATA_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cur.execute(
                "INSERT INTO sales VALUES (NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    row["日期"], row["城市"], row["门店编号"], row["产品名称"],
                    row["产品类别"], float(row["单价(元)"]), int(row["销量(杯)"]),
                    float(row["折扣"]), float(row["实付金额(元)"]),
                    float(row["会员占比(%)"]), row["天气"], row["季节"],
                    row["是否节假日"], row["营销活动"],
                ),
            )
    conn.commit()
    conn.close()


def query(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/summary")
def api_summary():
    r = query("SELECT SUM(quantity) as total_qty, SUM(revenue) as total_revenue, COUNT(*) as total_records, AVG(member_pct) as avg_member from sales")[0]
    return jsonify(r)


@app.route("/api/monthly")
def api_monthly():
    r = query("SELECT strftime('%Y-%m', date) as month, SUM(quantity) as qty, SUM(revenue) as revenue FROM sales GROUP BY month ORDER BY month")
    return jsonify(r)

@app.route("/api/product_rank")
def api_product_rank():
    """产品销量排名"""
    rows = query("SELECT product, category, SUM(quantity) as qty, SUM(revenue) as revenue FROM sales GROUP BY product ORDER BY qty DESC")
    return jsonify(rows)


@app.route("/api/city_rank")
def api_city_rank():
    """城市销量排名"""
    rows = query("SELECT city, SUM(quantity) as qty, SUM(revenue) as revenue FROM sales GROUP BY city ORDER BY revenue DESC")
    return jsonify(rows)


@app.route("/api/season")
def api_season():
    """季节对比"""
    rows = query("SELECT season, SUM(quantity) as qty, SUM(revenue) as revenue FROM sales GROUP BY season")
    return jsonify(rows)


@app.route("/api/category_pie")
def api_category_pie():
    """产品类别占比"""
    rows = query("SELECT category, SUM(quantity) as qty FROM sales GROUP BY category ORDER BY qty DESC")
    return jsonify(rows)


@app.route("/api/weather")
def api_weather():
    """天气影响"""
    rows = query("SELECT weather, AVG(quantity) as avg_qty, SUM(quantity) as total_qty FROM sales GROUP BY weather ORDER BY total_qty DESC")
    return jsonify(rows)


@app.route("/api/campaign")
def api_campaign():
    """营销活动效果"""
    rows = query("SELECT CASE WHEN campaign IS NOT NULL AND campaign != '' THEN campaign ELSE '无活动' END as campaign, AVG(quantity) as avg_qty, SUM(revenue) as revenue, COUNT(*) as days FROM sales GROUP BY campaign ORDER BY revenue DESC")
    return jsonify(rows)


@app.route("/api/holiday")
def api_holiday():
    """节假日对比"""
    rows = query("SELECT is_holiday, AVG(quantity) as avg_qty, AVG(revenue) as avg_revenue FROM sales GROUP BY is_holiday")
    return jsonify(rows)


@app.route("/api/discount")
def api_discount():
    """折扣分析"""
    rows = query("SELECT discount, AVG(quantity) as avg_qty, SUM(revenue) as revenue FROM sales GROUP BY discount ORDER BY discount")
    return jsonify(rows)


@app.route("/api/city_product")
def api_city_product():
    """城市 x 产品 热力图"""
    rows = query("SELECT city, product, SUM(quantity) as qty FROM sales GROUP BY city, product")
    cities = sorted(set(r["city"] for r in rows))
    products = sorted(set(r["product"] for r in rows))
    data = [[products.index(r["product"]), cities.index(r["city"]), r["qty"]] for r in rows]
    return jsonify({"cities": cities, "products": products, "data": data})



if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        init_db()
    app.run(host="0.0.0.0", port=8080, debug=True)