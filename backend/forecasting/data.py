from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "interest_over_time.csv"

BRAND_NAMES = {
    "Chatime: (Canada)": "Chatime",
    "Gong Cha: (Canada)": "Gong Cha",
    "CoCo Fresh Tea & Juice: (Canada)": "CoCo",
    "Molly Tea: (Canada)": "Molly Tea",
    "HEYTEA: (Canada)": "HEYTEA",
}


def load_time_series(path=DATA_PATH):
    frame = pd.read_csv(path, skiprows=2)
    frame = frame.rename(columns=BRAND_NAMES)

    frame["Week"] = pd.to_datetime(frame["Week"])
    frame = frame.set_index("Week").sort_index()

    brands = list(BRAND_NAMES.values())
    frame = frame[brands].apply(pd.to_numeric, errors="coerce")

    return frame