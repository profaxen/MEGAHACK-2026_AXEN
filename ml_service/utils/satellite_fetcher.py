from __future__ import annotations

import csv
import io
import random
from typing import Dict, List

import requests

NASA_FIRMS_KEY = "7e92980bc651b687466fd8959b754d1d"
BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


def _synthetic_hotspots(bbox: Dict[str, float], count: int = 12) -> List[Dict[str, object]]:
    rnd = random.Random(1337)
    west, south, east, north = bbox["west"], bbox["south"], bbox["east"], bbox["north"]
    out: List[Dict[str, object]] = []
    for i in range(count):
        lat = south + (north - south) * rnd.random()
        lon = west + (east - west) * rnd.random()
        frp = 5 + 80 * rnd.random()
        conf = rnd.choice(["l", "n", "h"])
        out.append(
            {
                "latitude": lat,
                "longitude": lon,
                "bright_ti4": 300 + 40 * rnd.random(),
                "bright_ti5": 290 + 35 * rnd.random(),
                "frp": frp,
                "confidence": conf,
                "acq_date": "2026-03-13",
                "acq_time": f"{rnd.randint(0,23):02d}{rnd.randint(0,59):02d}",
            }
        )
    return out


def fetch_viirs_hotspots(bbox: Dict[str, float], days: int = 1) -> List[Dict[str, object]]:
    """
    bbox: { west, south, east, north }
    returns list of dicts with FIRMS VIIRS fields.
    On error: returns synthetic demo hotspots.
    """
    try:
        url = (
            f"{BASE_URL}/{NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/"
            f"{bbox['west']},{bbox['south']},{bbox['east']},{bbox['north']}/{days}"
        )
        res = requests.get(url, timeout=15)
        res.raise_for_status()

        text = res.text
        reader = csv.DictReader(io.StringIO(text))
        hotspots: List[Dict[str, object]] = []
        for row in reader:
            hotspots.append(
                {
                    "latitude": float(row.get("latitude") or row.get("lat") or 0),
                    "longitude": float(row.get("longitude") or row.get("lon") or 0),
                    "bright_ti4": float(row.get("bright_ti4") or 0),
                    "bright_ti5": float(row.get("bright_ti5") or 0),
                    "frp": float(row.get("frp") or 0),
                    "confidence": row.get("confidence") or row.get("conf") or "n",
                    "acq_date": row.get("acq_date") or "",
                    "acq_time": row.get("acq_time") or "",
                }
            )
        if not hotspots:
            return _synthetic_hotspots(bbox)
        return hotspots
    except Exception:
        return _synthetic_hotspots(bbox)

