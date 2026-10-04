import os
import joblib
import numpy as np
import pandas as pd
from ..config import settings

_artifact = None

# Risk level -> a representative point on the 0-100 scale used when blending
# with the model's own class probabilities (see score_to_100 below).
LEVEL_ORDER = ["Low", "Moderate", "High", "Critical"]


def _load():
    global _artifact
    if _artifact is None:
        path = settings.model_path
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Risk model not found at {path}. Run `python scripts/train_model.py` first."
            )
        _artifact = joblib.load(path)
    return _artifact


def _vector_from_reading(reading: dict, defaults: dict, features: list[str]) -> list[float]:
    return [float(reading.get(f) if reading.get(f) is not None else defaults[f]) for f in features]


def score_to_100(level: str, class_probs: dict) -> int:
    """
    Converts the model's class probabilities into a single 0-100 score.
    Each class occupies a 25-point band; within that band, the score moves
    with the model's confidence that higher classes are also plausible —
    so two "Moderate" predictions aren't necessarily scored identically.
    """
    idx = LEVEL_ORDER.index(level)
    band_start = idx * 25
    # Weighted "severity lean": how much probability mass sits on this class
    # and above vs below, nudges the score within its 25-point band.
    upper_mass = sum(class_probs.get(LEVEL_ORDER[i], 0) for i in range(idx, len(LEVEL_ORDER)))
    within_band = min(24, round(upper_mass * 25))
    return min(100, band_start + within_band)


def predict_risk(reading: dict) -> dict:
    """
    reading: dict with any of systolic, diastolic, bloodSugar, heartRate, spo2, temperature.
    Missing vitals are imputed with population-normal defaults.

    Returns: { level, score, confidence, probabilities, missingVitals }
    """
    artifact = _load()
    model = artifact["model"]
    features = artifact["features"]
    defaults = artifact["defaults"]

    missing = [f for f in features if reading.get(f) is None]
    vector = _vector_from_reading(reading, defaults, features)
    X = pd.DataFrame([vector], columns=features)

    probs = model.predict_proba(X)[0]
    class_probs = dict(zip(model.classes_, probs))
    level = max(class_probs, key=class_probs.get)
    confidence = round(float(class_probs[level]) * 100, 1)
    score = score_to_100(level, class_probs)

    return {
        "level": level,
        "score": score,
        "confidence": confidence,
        "probabilities": {k: round(float(v) * 100, 1) for k, v in class_probs.items()},
        "missingVitals": missing,
    }
