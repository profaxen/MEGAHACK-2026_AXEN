from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    _TORCH_OK = True
except Exception:  # pragma: no cover
    torch = None  # type: ignore
    nn = None  # type: ignore
    F = None  # type: ignore
    _TORCH_OK = False


CLASSES: List[str] = [
    "illegal_waste_burning",
    "agricultural_fire",
    "industrial_flare",
    "natural_fire",
]


def _land_use_feature(land_use: str) -> float:
    m = {
        "landfill": 1.0,
        "industrial": 0.8,
        "urban": 0.5,
        "agricultural": 0.6,
        "forest": 0.3,
        "unknown": 0.4,
    }
    return float(m.get(land_use, 0.4))


class _FusionMLP(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(8, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 4)
        self.drop = nn.Dropout(0.3)

    def forward(self, x: "torch.Tensor") -> "torch.Tensor":
        x = self.drop(F.relu(self.fc1(x)))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return F.softmax(x, dim=1)


@dataclass
class FusionClassifier:
    def __post_init__(self) -> None:
        self.demo_mode = not _TORCH_OK
        self.device = "cpu"
        if _TORCH_OK:
            self.model = _FusionMLP()
            self.model.eval()
        else:
            self.model = None

    def load_weights(self, path: str) -> bool:
        if not _TORCH_OK:
            self.demo_mode = True
            return False
        try:
            state = torch.load(path, map_location=self.device)
            self.model.load_state_dict(state)
            self.model.eval()
            self.demo_mode = False
            return True
        except Exception:
            self.demo_mode = True
            return False

    def predict(
        self,
        smoke_prob: float,
        thermal_prob: float,
        ndvi: float,
        nbr: float,
        bai: float,
        land_use: str,
        hour: int,
        area_km2: float,
    ) -> Dict[str, object]:
        land_use_f = _land_use_feature(land_use)
        hour_f = float(np.clip(hour / 23.0, 0.0, 1.0))
        area_f = float(np.clip(area_km2 / 10.0, 0.0, 1.0))
        bai_f = float(np.clip(bai / 1500.0, 0.0, 1.0))

        vec = np.array(
            [
                smoke_prob,
                thermal_prob,
                ndvi,
                nbr,
                bai_f,
                land_use_f,
                hour_f,
                area_f,
            ],
            dtype=np.float32,
        )[None, :]

        if self.demo_mode or (not _TORCH_OK) or self.model is None:
            # heuristic: smoke+thermal high => illegal waste / industrial; NDVI higher => agricultural/natural
            base = np.array([0.25, 0.25, 0.25, 0.25], dtype=np.float32)
            base[0] += float(smoke_prob * 0.35 + thermal_prob * 0.25 + (1.0 - ndvi) * 0.15)
            base[2] += float(thermal_prob * 0.25 + land_use_f * 0.2)
            base[1] += float(ndvi * 0.25 + (1.0 - thermal_prob) * 0.1)
            base[3] += float(ndvi * 0.2 + (1.0 - land_use_f) * 0.1)
            base = np.maximum(base, 0.01)
            probs = base / float(base.sum())
        else:
            with torch.no_grad():
                xt = torch.from_numpy(vec).to(self.device)
                out = self.model(xt).cpu().numpy()[0]
                probs = out / float(out.sum())

        class_probs = {CLASSES[i]: float(probs[i]) for i in range(4)}
        classification = max(class_probs, key=class_probs.get)
        return {
            "classification": classification,
            "confidence": float(class_probs[classification]),
            "class_probabilities": class_probs,
        }

