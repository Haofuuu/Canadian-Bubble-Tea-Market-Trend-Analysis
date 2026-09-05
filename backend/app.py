import csv
import os
import sqlite3

from flask import Flask, jsonify, send_from_directory


app = Flask(__name__, static_folder="../frontend", static_url_path="")

BASE_DIR = os.path.dirname(__file__)
TIME_DATA_PATH = os.path.join(BASE_DIR, "..", "data", "interest_over_time.csv")
PROVINCE_DATA_PATH = os.path.join(BASE_DIR, "..", "data", "interest_by_province.csv")
CITY_DATA_PATH = os.path.join(BASE_DIR, "..", "data", "interest_by_city.csv")
DB_PATH = os.path.join(BASE_DIR, "google_trends.db")


def clean_interest(value):
    value = value.strip().replace("%", "")
    if not value:
        return None
    if value == "<1":
        return 0.5
    return float(value)


def brand_name(header):
    return header.split(":")[0].strip()


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as file:
        next(file)  # Skip the Google Trends category line.
        next(file)  # Skip the blank line.
        return list(csv.DictReader(file))


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS interest_over_time")
    cur.execute("DROP TABLE IF EXISTS interest_by_province")
    cur.execute("DROP TABLE IF EXISTS interest_by_city")

    cur.execute(
        "CREATE TABLE interest_over_time (week TEXT, brand TEXT, interest REAL)"
    )
    cur.execute(
        "CREATE TABLE interest_by_province (province TEXT, brand TEXT, interest REAL)"
    )
    cur.execute(
        "CREATE TABLE interest_by_city (city TEXT, brand TEXT, interest REAL)"
    )

    for row in read_csv(TIME_DATA_PATH):
        week = row["Week"]
        for header, value in row.items():
            if header == "Week":
                continue
            interest = clean_interest(value)
            if interest is not None:
                cur.execute(
                    "INSERT INTO interest_over_time VALUES (?, ?, ?)",
                    (week, brand_name(header), interest),
                )

    for row in read_csv(PROVINCE_DATA_PATH):
        province = row["Region"]
        for header, value in row.items():
            if header == "Region":
                continue
            interest = clean_interest(value)
            if interest is not None:
                cur.execute(
                    "INSERT INTO interest_by_province VALUES (?, ?, ?)",
                    (province, brand_name(header), interest),
                )

    for row in read_csv(CITY_DATA_PATH):
        city = row["City"]
        for header, value in row.items():
            if header == "City":
                continue
            interest = clean_interest(value)
            if interest is not None:
                cur.execute(
                    "INSERT INTO interest_by_city VALUES (?, ?, ?)",
                    (city, brand_name(header), interest),
                )

    conn.commit()
    conn.close()


def query(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/summary")
def api_summary():
    time_summary = query(
        "SELECT COUNT(DISTINCT week) AS weeks, "
        "COUNT(DISTINCT brand) AS brands FROM interest_over_time"
    )[0]
    location_summary = query(
        "SELECT "
        "(SELECT COUNT(DISTINCT province) FROM interest_by_province) AS provinces, "
        "(SELECT COUNT(DISTINCT city) FROM interest_by_city) AS cities"
    )[0]
    time_summary.update(location_summary)
    return jsonify(time_summary)


@app.route("/api/monthly")
def api_monthly():
    rows = query(
        "SELECT substr(week, 1, 7) AS month, brand, "
        "ROUND(AVG(interest), 1) AS interest "
        "FROM interest_over_time "
        "GROUP BY month, brand "
        "ORDER BY month, brand"
    )
    return jsonify(rows)


@app.route("/api/provinces")
def api_provinces():
    rows = query(
        "SELECT province, brand, interest FROM interest_by_province "
        "ORDER BY province, brand"
    )
    return jsonify(rows)


@app.route("/api/cities")
def api_cities():
    rows = query(
        "SELECT city, brand, interest FROM interest_by_city "
        "ORDER BY city, brand"
    )
    return jsonify(rows)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8080, debug=True)
