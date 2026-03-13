from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
from sklearn.cluster import DBSCAN

try:
    from shapely.geometry import MultiPoint
except Exception:  # pragma: no cover
    MultiPoint = None  # type: ignore


@dataclass
class ClusterResult:
    labels: List[int]
    clusters: List[Dict[str, object]]


def cluster_events(
    points: List[Tuple[float, float]],
    eps_km: float = 20.0,
    min_samples: int = 3,
) -> ClusterResult:
    """
    points: list of (lat, lon)
    Uses DBSCAN with haversine metric. Returns cluster labels and cluster hulls (if shapely available).
    """
    if not points:
        return ClusterResult(labels=[], clusters=[])

    coords = np.radians(np.array(points, dtype=np.float64))
    eps = eps_km / 6371.0

    db = DBSCAN(eps=eps, min_samples=min_samples, metric="haversine")
    labels = db.fit_predict(coords).tolist()

    clusters: List[Dict[str, object]] = []
    label_set = sorted({l for l in labels if l != -1})
    for lbl in label_set:
        idxs = [i for i, l in enumerate(labels) if l == lbl]
        pts = [points[i] for i in idxs]
        lats = [p[0] for p in pts]
        lons = [p[1] for p in pts]
        centroid_lat = float(np.mean(lats))
        centroid_lon = float(np.mean(lons))

        hull_coords = None
        if MultiPoint is not None and len(pts) >= 3:
            mp = MultiPoint([(lon, lat) for lat, lon in pts])
            hull = mp.convex_hull
            if hasattr(hull, "exterior"):
                hull_coords = [(float(y), float(x)) for x, y in list(hull.exterior.coords)]

        clusters.append(
            {
                "id": f"cluster_{lbl:02d}",
                "centroid_lat": centroid_lat,
                "centroid_lon": centroid_lon,
                "event_count": len(pts),
                "hull": hull_coords,
            }
        )

    return ClusterResult(labels=labels, clusters=clusters)

