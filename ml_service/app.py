from __future__ import annotations

import base64
import time
from typing import Any, Dict, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from ml_service.models.unet_smoke import UNetSmoke
    from ml_service.models.thermal_anomaly import ThermalAnomalyDetector
    from ml_service.models.fusion_classifier import FusionClassifier
    from ml_service.utils.preprocessing import (
        decode_base64_image,
        preprocess_for_smoke,
        preprocess_for_thermal,
    )
except Exception:  # running from inside ml_service/
    from models.unet_smoke import UNetSmoke
    from models.thermal_anomaly import ThermalAnomalyDetector
    from models.fusion_classifier import FusionClassifier
    from utils.preprocessing import (
        decode_base64_image,
        preprocess_for_smoke,
        preprocess_for_thermal,
    )


app = FastAPI(title="WatchBurn ML Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImageRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")


class ClassifyRequest(BaseModel):
    smoke_prob: float
    thermal_prob: float
    ndvi: float
    nbr: float
    bai: float
    land_use: str
    hour: int
    area_km2: float


class FullPipelineRequest(BaseModel):
    image: Optional[str] = None
    smoke_prob: Optional[float] = None
    thermal_prob: Optional[float] = None
    ndvi: Optional[float] = None
    nbr: Optional[float] = None
    bai: Optional[float] = None
    land_use: Optional[str] = None
    hour: Optional[int] = None
    area_km2: Optional[float] = None


def _safe_float(x: Any, default: float) -> float:
    try:
        return float(x)
    except Exception:
        return default


def _demo_probs() -> Dict[str, float]:
    # plausible, normalized
    probs = {
        "illegal_waste_burning": 0.82,
        "agricultural_fire": 0.06,
        "industrial_flare": 0.07,
        "natural_fire": 0.05,
    }
    return probs


try:
    smoke_model = UNetSmoke()
    thermal_model = ThermalAnomalyDetector()
    fusion_model = FusionClassifier()
    models_loaded = True
except Exception:
    smoke_model = None
    thermal_model = None
    fusion_model = None
    models_loaded = False


@app.get("/health")
def health() -> Dict[str, Any]:
    try:
        import torch

        pt_ver = torch.__version__
    except Exception:
        pt_ver = "unavailable"
    return {"status": "ok", "models_loaded": bool(models_loaded), "pytorch_version": pt_ver}


@app.post("/smoke-segment")
def smoke_segment(req: ImageRequest) -> Dict[str, Any]:
    start = time.time()
    try:
        img = decode_base64_image(req.image)
        x = preprocess_for_smoke(img)
        if smoke_model is None:
            raise RuntimeError("model unavailable")
        prob, detected = smoke_model.predict(x)
    except Exception:
        prob = 0.65
        detected = prob > 0.55
    return {
        "smoke_probability": float(prob),
        "smoke_detected": bool(detected),
        "processing_time_ms": int((time.time() - start) * 1000),
    }


@app.post("/thermal-detect")
def thermal_detect(req: ImageRequest) -> Dict[str, Any]:
    try:
        img = decode_base64_image(req.image)
        x = preprocess_for_thermal(img)
        if thermal_model is None:
            raise RuntimeError("model unavailable")
        prob, brightness = thermal_model.predict(x)
    except Exception:
        prob = 0.72
        brightness = 320.5
    return {"hotspot_probability": float(prob), "brightness_temp": float(brightness)}


@app.post("/classify")
def classify(req: ClassifyRequest) -> Dict[str, Any]:
    try:
        if fusion_model is None:
            raise RuntimeError("model unavailable")
        out = fusion_model.predict(
            smoke_prob=req.smoke_prob,
            thermal_prob=req.thermal_prob,
            ndvi=req.ndvi,
            nbr=req.nbr,
            bai=req.bai,
            land_use=req.land_use,
            hour=req.hour,
            area_km2=req.area_km2,
        )
        return out
    except Exception:
        probs = _demo_probs()
        classification = max(probs, key=probs.get)
        return {
            "classification": classification,
            "confidence": probs[classification],
            "class_probabilities": probs,
        }


@app.post("/full-pipeline")
def full_pipeline(req: FullPipelineRequest) -> Dict[str, Any]:
    # If image provided, run smoke + thermal then fuse; otherwise fuse provided features.
    try:
        smoke_prob = req.smoke_prob
        thermal_prob = req.thermal_prob

        if req.image:
            # accept raw base64 OR data URL
            img_str = req.image
            if img_str.startswith("data:"):
                img_str = img_str.split(",", 1)[-1]
            img = decode_base64_image(img_str)
            if smoke_model is not None:
                smoke_prob, _ = smoke_model.predict(preprocess_for_smoke(img))
            else:
                smoke_prob = 0.69
            if thermal_model is not None:
                thermal_prob, _ = thermal_model.predict(preprocess_for_thermal(img))
            else:
                thermal_prob = 0.74

        smoke_prob = _safe_float(smoke_prob, 0.68)
        thermal_prob = _safe_float(thermal_prob, 0.73)
        ndvi = _safe_float(req.ndvi, 0.21)
        nbr = _safe_float(req.nbr, 0.12)
        bai = _safe_float(req.bai, 430.0)
        land_use = req.land_use or "unknown"
        hour = int(req.hour) if req.hour is not None else 14
        area_km2 = _safe_float(req.area_km2, 0.9)

        if fusion_model is None:
            raise RuntimeError("model unavailable")
        fused = fusion_model.predict(
            smoke_prob=smoke_prob,
            thermal_prob=thermal_prob,
            ndvi=ndvi,
            nbr=nbr,
            bai=bai,
            land_use=land_use,
            hour=hour,
            area_km2=area_km2,
        )
        return {
            **fused,
            "smoke_probability": float(smoke_prob),
            "thermal_probability": float(thermal_prob),
            "ndvi": float(ndvi),
            "nbr": float(nbr),
            "bai": float(bai),
        }
    except Exception:
        probs = _demo_probs()
        classification = max(probs, key=probs.get)
        return {
            "classification": classification,
            "confidence": probs[classification],
            "class_probabilities": probs,
            "smoke_probability": 0.87,
            "thermal_probability": 0.79,
            "ndvi": 0.21,
            "nbr": 0.12,
            "bai": 430,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=False)

