"""WatchBurn ML Service - FastAPI backend for smoke, thermal, and classification models."""

import base64
import random
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="WatchBurn ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo fallback when models not loaded
MODELS_LOADED = False


class SmokeSegmentInput(BaseModel):
    image: str  # base64


class SmokeSegmentOutput(BaseModel):
    smoke_probability: float
    smoke_detected: bool
    processing_time_ms: int


class ThermalDetectInput(BaseModel):
    image: str  # base64


class ThermalDetectOutput(BaseModel):
    hotspot_probability: float
    brightness_temp: float


class ClassifyInput(BaseModel):
    smoke_prob: float
    thermal_prob: float
    ndvi: float
    nbr: float
    bai: float
    land_use: str
    hour: int
    area_km2: float


class ClassifyOutput(BaseModel):
    classification: str
    confidence: float
    class_probabilities: dict


class FullPipelineOutput(BaseModel):
    classification: str
    confidence: float
    class_probabilities: dict
    smoke_probability: float
    thermal_score: float
    processing_time_ms: int


def _demo_smoke() -> SmokeSegmentOutput:
    p = round(random.uniform(0.3, 0.95), 3)
    return SmokeSegmentOutput(
        smoke_probability=p,
        smoke_detected=p > 0.5,
        processing_time_ms=random.randint(80, 150),
    )


def _demo_thermal() -> ThermalDetectOutput:
    p = round(random.uniform(0.2, 0.9), 3)
    bt = round(random.uniform(350, 550), 1)
    return ThermalDetectOutput(
        hotspot_probability=p,
        brightness_temp=bt,
    )


def _demo_classify() -> ClassifyOutput:
    classes = [
        "illegal_waste_burning",
        "agricultural_fire",
        "industrial_flare",
        "natural_fire",
    ]
    probs = [random.random() for _ in classes]
    total = sum(probs)
    probs = [round(p / total, 3) for p in probs]
    idx = probs.index(max(probs))
    return ClassifyOutput(
        classification=classes[idx],
        confidence=round(probs[idx], 3),
        class_probabilities=dict(zip(classes, probs)),
    )


@app.post("/smoke-segment", response_model=SmokeSegmentOutput)
async def smoke_segment(req: SmokeSegmentInput):
    if MODELS_LOADED:
        # TODO: run U-Net model
        pass
    return _demo_smoke()


@app.post("/thermal-detect", response_model=ThermalDetectOutput)
async def thermal_detect(req: ThermalDetectInput):
    if MODELS_LOADED:
        # TODO: run thermal CNN
        pass
    return _demo_thermal()


@app.post("/classify", response_model=ClassifyOutput)
async def classify(req: ClassifyInput):
    if MODELS_LOADED:
        # TODO: run fusion classifier
        pass
    return _demo_classify()


@app.post("/full-pipeline", response_model=FullPipelineOutput)
async def full_pipeline():
    smoke = _demo_smoke()
    thermal = _demo_thermal()
    classify_out = _demo_classify()
    return FullPipelineOutput(
        classification=classify_out.classification,
        confidence=classify_out.confidence,
        class_probabilities=classify_out.class_probabilities,
        smoke_probability=smoke.smoke_probability,
        thermal_score=thermal.hotspot_probability,
        processing_time_ms=smoke.processing_time_ms + 50,
    )


@app.get("/health")
async def health():
    import torch
    return {
        "status": "ok",
        "models_loaded": MODELS_LOADED,
        "pytorch_version": torch.__version__,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
