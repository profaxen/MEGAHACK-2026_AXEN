from __future__ import annotations

import base64
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image


def decode_base64_image(image_b64: str) -> Image.Image:
    raw = base64.b64decode(image_b64)
    img = Image.open(BytesIO(raw)).convert("RGB")
    return img


def _to_float_tensor(img: Image.Image, size: int) -> np.ndarray:
    resized = img.resize((size, size), resample=Image.BILINEAR)
    arr = np.asarray(resized).astype(np.float32) / 255.0  # (H,W,3)
    return arr


def preprocess_for_smoke(img: Image.Image) -> np.ndarray:
    """
    Create a pseudo 6-channel Sentinel-2 style input from RGB.
    Output shape: (1, 6, 256, 256)
    """
    rgb = _to_float_tensor(img, 256)  # (256,256,3)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    nir = (0.6 * r + 0.8 * g + 0.3 * b) / 1.7
    swir1 = (0.4 * r + 0.2 * g + 0.9 * b) / 1.5
    swir2 = (0.3 * r + 0.1 * g + 1.0 * b) / 1.4

    x = np.stack([r, g, b, nir, swir1, swir2], axis=0).astype(np.float32)  # (6,H,W)
    return x[None, ...]


def preprocess_for_thermal(img: Image.Image) -> np.ndarray:
    """
    Create a pseudo 1-channel thermal patch from RGB.
    Output shape: (1, 1, 80, 80)
    """
    arr = _to_float_tensor(img, 80)
    gray = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]).astype(np.float32)
    # boost hotspots with contrast curve
    gray = np.clip(gray ** 0.7, 0.0, 1.0)
    return gray[None, None, ...]

