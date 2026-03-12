"""DBSCAN clustering for event aggregation."""

import numpy as np
from sklearn.cluster import DBSCAN


def cluster_events(
    lats: np.ndarray,
    lons: np.ndarray,
    eps_km: float = 5.0,
    min_samples: int = 2,
) -> np.ndarray:
    """Cluster lat/lon points using DBSCAN.
    eps_km: max distance in km for neighbors
    min_samples: min points to form cluster
    Returns cluster labels (-1 = noise).
    """
    lat_rad = np.radians(lats)
    lon_rad = np.radians(lons)
    R = 6371  # Earth radius km
    x = R * np.cos(lat_rad) * np.cos(lon_rad)
    y = R * np.cos(lat_rad) * np.sin(lon_rad)
    z = R * np.sin(lat_rad)
    coords = np.column_stack([x, y, z])
    eps_m = eps_km * 1000
    db = DBSCAN(eps=eps_m, min_samples=min_samples, metric="euclidean")
    return db.fit_predict(coords)
