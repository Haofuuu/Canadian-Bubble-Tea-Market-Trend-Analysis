# Bubble Tea Signals

An interactive market-intelligence dashboard for exploring how Canadians search for leading bubble tea brands.

Bubble Tea Signals turns Google Trends data into a focused view of brand demand, momentum, peak periods, and regional fit. It currently compares **Chatime, Gong Cha, CoCo Fresh Tea & Juice, Molly Tea, and HEYTEA** across 193 weeks of national data, with additional province- and city-level views.

## What the dashboard shows

- **Executive snapshot** — overall leader, current leader, fastest-growing brand, and highest-interest week
- **National demand trend** — monthly search-interest movement across all five brands
- **Year-over-year growth** — rolling three-month performance against the same period one year earlier
- **Peak-period analysis** — each brand's strongest sustained three-month window
- **Recent acceleration** — whether short-term momentum is improving or slowing
- **Regional over-indexing** — provinces where a brand is unusually strong relative to its national mix
- **City-level interest** — a heatmap of local brand interest across Canadian cities

## Tech stack

- **Backend:** Python and Flask
- **Data layer:** SQLite, generated from the included CSV files at startup
- **Frontend:** semantic HTML, responsive CSS, and vanilla JavaScript
- **Visualization:** Apache ECharts

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Haofuuu/Canadian-Bubble-Tea-Market-Trend-Analysis.git
cd Canadian-Bubble-Tea-Market-Trend-Analysis
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows, activate it with:

```powershell
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the dashboard

```bash
python backend/app.py
```

Open [http://localhost:8080](http://localhost:8080) in your browser. The app creates `backend/google_trends.db` automatically from the source CSV files each time it starts.

## Project structure

```text
.
├── backend/
│   ├── app.py                 # Flask server, data import, and JSON endpoints
│   └── forecasting/           # Experimental helpers; not used by the dashboard
├── data/
│   ├── interest_over_time.csv
│   ├── interest_by_province.csv
│   └── interest_by_city.csv
├── frontend/
│   ├── index.html             # Dashboard structure
│   ├── css/style.css          # Responsive visual system
│   └── js/charts.js           # Metrics, insights, and ECharts configuration
├── requirements.txt
└── README.md
```

## API endpoints

The Flask app exposes the normalized dataset through a small read-only API:

| Endpoint | Description |
| --- | --- |
| `/api/summary` | Counts of weeks, brands, provinces, and cities |
| `/api/weekly` | Weekly national interest by brand |
| `/api/monthly` | Monthly average interest by brand |
| `/api/provinces` | Province-level brand interest |
| `/api/cities` | City-level brand interest |

## Interpreting the data

Google Trends scores measure **relative search interest** on a normalized 0–100 scale. They do not represent sales, market share, absolute search volume, or unaided brand awareness. Geographic comparisons are also normalized within their own result set, so the dashboard is best used to identify directional patterns rather than estimate market size.

## Data source

The included CSV exports were collected from [Google Trends](https://trends.google.com/trends/) for Canada. The dashboard covers data through August 2026.

## Contributing

Issues and pull requests are welcome. If you add a new analysis, keep the methodology explicit and preserve the distinction between relative search interest and commercial performance.
