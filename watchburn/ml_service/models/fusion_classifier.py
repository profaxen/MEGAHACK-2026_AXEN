"""Fusion classifier MLP: 8 features -> 4-class probability distribution."""

from pathlib import Path

import torch
import torch.nn as nn

MODEL_PATH = Path(__file__).parent.parent / "weights" / "fusion_classifier.pt"

CLASSES = [
    "illegal_waste_burning",
    "agricultural_fire",
    "industrial_flare",
    "natural_fire",
]


class FusionClassifier(nn.Module):
    """MLP: 8 -> 128 -> 64 -> 4, ReLU, Dropout 0.3, Softmax."""

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(8, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 4),
        )

    def forward(self, x):
        logits = self.net(x)
        return torch.softmax(logits, dim=-1)

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
    ) -> tuple[str, float, dict]:
        """Return (classification, confidence, class_probabilities)."""
        land_use_idx = {
            "landfill": 0,
            "industrial": 1,
            "agricultural": 2,
            "urban": 3,
            "forest": 4,
            "unknown": 5,
        }.get(land_use, 5)
        x = torch.tensor(
            [
                [
                    smoke_prob,
                    thermal_prob,
                    ndvi,
                    nbr,
                    bai,
                    float(land_use_idx) / 5.0,
                    float(hour) / 24.0,
                    min(area_km2 / 100.0, 1.0),
                ]
            ],
            dtype=torch.float32,
        )
        with torch.no_grad():
            probs = self.forward(x).squeeze(0)
            probs_list = probs.tolist()
            idx = probs.argmax().item()
        return (
            CLASSES[idx],
            probs_list[idx],
            dict(zip(CLASSES, probs_list)),
        )

    def load_weights(self, path: Path | str = MODEL_PATH):
        if Path(path).exists():
            self.load_state_dict(torch.load(path, map_location="cpu"))
