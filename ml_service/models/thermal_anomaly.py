"""Thermal anomaly CNN for Landsat-8 Band 10 hotspot detection."""

import torch
import torch.nn as nn
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "weights" / "thermal_anomaly.pt"


class ThermalAnomalyDetector(nn.Module):
    """CNN: 1ch 80x80 input, 4 Conv blocks + 3 FC, output hotspot probability."""

    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(128, 256, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        x = self.features(x)
        return self.classifier(x).squeeze(-1)

    def predict(self, x: torch.Tensor) -> tuple[float, float]:
        """Return (hotspot_probability, brightness_temp_estimate)."""
        with torch.no_grad():
            prob = self.forward(x).item()
            bt = 350.0 + prob * 200.0
        return prob, bt

    def load_weights(self, path: Path | str = MODEL_PATH):
        if Path(path).exists():
            self.load_state_dict(torch.load(path, map_location="cpu"))
