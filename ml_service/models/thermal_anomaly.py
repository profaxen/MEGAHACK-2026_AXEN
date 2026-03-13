from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

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


class _ThermalCNN(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.conv1 = nn.Conv2d(1, 16, 3, padding=1)
        self.conv2 = nn.Conv2d(16, 32, 3, padding=1)
        self.conv3 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv4 = nn.Conv2d(64, 96, 3, padding=1)
        self.pool = nn.MaxPool2d(2)
        self.drop = nn.Dropout(0.4)
        self.fc1 = nn.Linear(96 * 5 * 5, 128)
        self.fc2 = nn.Linear(128, 32)
        self.fc3 = nn.Linear(32, 1)

    def forward(self, x: "torch.Tensor") -> "torch.Tensor":
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = self.pool(F.relu(self.conv4(x)))
        x = x.view(x.size(0), -1)
        x = self.drop(F.relu(self.fc1(x)))
        x = self.drop(F.relu(self.fc2(x)))
        x = self.fc3(x)
        return x


@dataclass
class ThermalAnomalyDetector:
    def __post_init__(self) -> None:
        self.demo_mode = not _TORCH_OK
        self.device = "cpu"
        if _TORCH_OK:
            self.model = _ThermalCNN()
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

    def predict(self, x: np.ndarray) -> Tuple[float, float]:
        """
        x: numpy array shape (1, 1, 80, 80), float32
        returns: hotspot_probability, brightness_temp
        """
        if self.demo_mode or (not _TORCH_OK) or self.model is None:
            mean = float(np.clip(np.mean(x), 0.0, 1.0))
            prob = float(np.clip(mean * 1.25, 0.05, 0.95))
            brightness = 280.0 + prob * 90.0
            return prob, float(brightness)

        with torch.no_grad():
            xt = torch.from_numpy(x).to(self.device)
            logit = self.model(xt)
            prob = float(torch.sigmoid(logit).cpu().item())
            brightness = 280.0 + prob * 90.0
            return prob, float(brightness)

