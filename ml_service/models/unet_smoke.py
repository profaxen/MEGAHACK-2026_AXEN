"""U-Net model for smoke segmentation from Sentinel-2 imagery."""

import torch
import torch.nn as nn
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "weights" / "unet_smoke.pt"


class DoubleConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class UNetSmoke(nn.Module):
    """U-Net for 6-channel Sentinel-2 input, 256x256, output binary smoke mask."""

    def __init__(self, in_channels: int = 6, out_channels: int = 1):
        super().__init__()
        self.enc1 = DoubleConv(in_channels, 64)
        self.enc2 = DoubleConv(64, 128)
        self.enc3 = DoubleConv(128, 256)
        self.enc4 = DoubleConv(256, 512)
        self.enc5 = DoubleConv(512, 1024)

        self.pool = nn.MaxPool2d(2)

        self.up5 = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.dec5 = DoubleConv(1024, 512)
        self.up4 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec4 = DoubleConv(512, 256)
        self.up3 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec3 = DoubleConv(256, 128)
        self.up2 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec2 = DoubleConv(128, 64)

        self.out = nn.Conv2d(64, out_channels, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        e5 = self.enc5(self.pool(e4))

        d5 = self.up5(e5)
        d5 = torch.cat([d5, e4], dim=1)
        d5 = self.dec5(d5)
        d4 = self.up4(d5)
        d4 = torch.cat([d4, e3], dim=1)
        d4 = self.dec4(d4)
        d3 = self.up3(d4)
        d3 = torch.cat([d3, e2], dim=1)
        d3 = self.dec3(d3)
        d2 = self.up2(d3)
        d2 = torch.cat([d2, e1], dim=1)
        d2 = self.dec2(d2)

        return torch.sigmoid(self.out(d2))

    def predict(self, x: torch.Tensor) -> tuple[float, bool]:
        """Return smoke_probability (mean) and smoke_detected (mean > 0.5)."""
        with torch.no_grad():
            out = self.forward(x)
            prob = out.mean().item()
            detected = prob > 0.5
        return prob, detected

    def load_weights(self, path: Path | str = MODEL_PATH):
        if Path(path).exists():
            self.load_state_dict(torch.load(path, map_location="cpu"))
