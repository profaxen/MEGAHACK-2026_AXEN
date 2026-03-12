"""Image preprocessing utilities for ML pipeline."""

import numpy as np
from PIL import Image
import cv2


def decode_base64_image(b64: str) -> np.ndarray:
    """Decode base64 string to numpy array (RGB)."""
    raw = np.frombuffer(__import__("base64").b64decode(b64), dtype=np.uint8)
    img = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def resize_to_256(img: np.ndarray) -> np.ndarray:
    """Resize image to 256x256."""
    return cv2.resize(img, (256, 256), interpolation=cv2.INTER_LINEAR)


def resize_to_80(img: np.ndarray) -> np.ndarray:
    """Resize to 80x80 for thermal model."""
    return cv2.resize(img, (80, 80), interpolation=cv2.INTER_LINEAR)


def to_6ch_sentinel2(img: np.ndarray) -> np.ndarray:
    """Convert RGB to 6-channel Sentinel-2 style (RGB + NIR + SWIR1 + SWIR2).
    If only RGB available, replicate channels as placeholder."""
    if img.shape[-1] == 3:
        nir = np.mean(img, axis=-1, keepdims=True)
        swir1 = np.mean(img[:, :, :2], axis=-1, keepdims=True)
        swir2 = img[:, :, 0:1] * 0.5
        return np.concatenate([img, nir, swir1, swir2], axis=-1)
    return img


def to_tensor_chw(arr: np.ndarray):
    """Convert HWC numpy to CHW tensor, normalize to [0,1]."""
    import torch  # noqa: F401
    arr = arr.astype(np.float32) / 255.0
    if arr.ndim == 2:
        arr = arr[:, :, np.newaxis]
    t = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
    return t
