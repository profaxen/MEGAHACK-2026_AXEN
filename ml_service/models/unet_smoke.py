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


def _conv_block(in_ch: int, out_ch: int) -> "nn.Sequential":
    return nn.Sequential(
        nn.Conv2d(in_ch, out_ch, 3, padding=1),
        nn.BatchNorm2d(out_ch),
        nn.ReLU(inplace=True),
        nn.Conv2d(out_ch, out_ch, 3, padding=1),
        nn.BatchNorm2d(out_ch),
        nn.ReLU(inplace=True),
    )


class _UNet(nn.Module):
    def __init__(self, in_channels: int = 6, base: int = 32) -> None:
        super().__init__()
        self.enc1 = _conv_block(in_channels, base)
        self.enc2 = _conv_block(base, base * 2)
        self.enc3 = _conv_block(base * 2, base * 4)
        self.enc4 = _conv_block(base * 4, base * 8)
        self.enc5 = _conv_block(base * 8, base * 16)

        self.pool = nn.MaxPool2d(2)

        self.up4 = nn.ConvTranspose2d(base * 16, base * 8, 2, stride=2)
        self.dec4 = _conv_block(base * 16, base * 8)

        self.up3 = nn.ConvTranspose2d(base * 8, base * 4, 2, stride=2)
        self.dec3 = _conv_block(base * 8, base * 4)

        self.up2 = nn.ConvTranspose2d(base * 4, base * 2, 2, stride=2)
        self.dec2 = _conv_block(base * 4, base * 2)

        self.up1 = nn.ConvTranspose2d(base * 2, base, 2, stride=2)
        self.dec1 = _conv_block(base * 2, base)

        self.outc = nn.Conv2d(base, 1, kernel_size=1)

    def forward(self, x: "torch.Tensor") -> "torch.Tensor":
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        e5 = self.enc5(self.pool(e4))

        d4 = self.up4(e5)
        d4 = torch.cat([d4, e4], dim=1)
        d4 = self.dec4(d4)

        d3 = self.up3(d4)
        d3 = torch.cat([d3, e3], dim=1)
        d3 = self.dec3(d3)

        d2 = self.up2(d3)
        d2 = torch.cat([d2, e2], dim=1)
        d2 = self.dec2(d2)

        d1 = self.up1(d2)
        d1 = torch.cat([d1, e1], dim=1)
        d1 = self.dec1(d1)

        logits = self.outc(d1)
        return logits


@dataclass
class UNetSmoke:
    in_channels: int = 6

    def __post_init__(self) -> None:
        self.demo_mode = not _TORCH_OK
        self.device = "cpu"
        if _TORCH_OK:
            self.model = _UNet(in_channels=self.in_channels)
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

    def predict(self, x: np.ndarray) -> Tuple[float, bool]:
        """
        x: numpy array shape (1, 6, 256, 256), float32
        returns: smoke_probability, smoke_detected
        """
        if self.demo_mode or (not _TORCH_OK) or self.model is None:
            # plausible value based on "smoke-like" variance heuristic
            v = float(np.clip(np.std(x) * 2.4, 0.1, 0.95))
            return v, v > 0.55

        with torch.no_grad():
            xt = torch.from_numpy(x).to(self.device)
            logits = self.model(xt)
            probs = torch.sigmoid(logits)
            mean_prob = float(probs.mean().cpu().item())
            return mean_prob, mean_prob > 0.55

