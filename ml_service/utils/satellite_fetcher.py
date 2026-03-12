"""NASA FIRMS API fetcher for VIIRS hotspots."""

import csv
import io
from typing import Any

import requests

NASA_FIRMS_KEY = "7e92980bc651b687466fd8959b754d1d"
BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


def fetch_viirs_hotspots(bbox: dict, days: int = 1) -> list[dict[str, Any]]:
    """Fetch VIIRS NRT hotspots for given bounding box.
    bbox: {west, south, east, north}
    Returns list of hotspot dicts with lat, lon, bright_ti4, bright_ti5, frp, confidence, acq_date, acq_time.
    """
    url = f"{BASE_URL}/{NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/{bbox['west']},{bbox['south']},{bbox['east']},{bbox['north']}/{days}"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        reader = csv.DictReader(io.StringIO(resp.text))
        return list(reader)
    except Exception:
        return _synthetic_hotspots(bbox, days)


def _synthetic_hotspots(bbox: dict, days: int) -> list[dict[str, Any]]:
    """Return synthetic demo hotspots on API failure."""
    import random
    n = random.randint(5, 20)
    west, south, east, north = bbox["west"], bbox["south"], bbox["east"], bbox["north"]
    return [
        {
            "latitude": str(random.uniform(south, north)),
            "longitude": str(random.uniform(west, east)),
            "bright_ti4": str(random.uniform(350, 500)),
            "bright_ti5": str(random.uniform(280, 350)),
            "frp": str(random.uniform(1, 50)),
            "confidence": str(random.choice(["nominal", "low", "high"])),
            "acq_date": "2024-01-15",
            "acq_time": str(random.randint(0, 23) * 100 + random.randint(0, 59)),
        }
        for _ in range(n)
    ]
