"""
Trains the VitalIQ risk classifier.

There is no real labeled patient dataset available for this project, so this
script generates a large synthetic dataset using widely published clinical
reference ranges (e.g. AHA blood pressure categories, ADA blood sugar
categories, normal heart rate / SpO2 / temperature bands) to assign a
ground-truth risk label to each simulated vitals vector, then trains a
RandomForestClassifier to learn the (intentionally noisy, overlapping)
decision boundary between classes.

This is a reasonable stand-in for Phase 3's "AI risk model" in a project
with no access to real clinical data, and keeps the decision logic
transparent and auditable — but it is NOT clinically validated. Swap
`generate_synthetic_dataset()` for a real, ethically-sourced, IRB-approved
dataset before using this for anything beyond a demo.

Usage:
    python scripts/train_model.py
"""
import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FEATURES = ["systolic", "diastolic", "bloodSugar", "heartRate", "spo2", "temperature"]
CLASSES = ["Low", "Moderate", "High", "Critical"]

# Population-normal defaults used to impute a missing vital during training
# AND at inference time, so both sides of the pipeline agree.
NORMAL_DEFAULTS = {
    "systolic": 118,
    "diastolic": 76,
    "bloodSugar": 95,
    "heartRate": 72,
    "spo2": 98,
    "temperature": 36.8,
}


def _score_vital(value, bands):
    """bands: list of (upper_bound_inclusive, points). First match wins."""
    for upper, points in bands:
        if value <= upper:
            return points
    return bands[-1][1]


def rule_based_points(row):
    """
    A transparent, clinically-informed point system. Higher points = higher
    risk. This is what generates the *training label* — the model then
    learns a smoothed, generalized version of this function.
    """
    points = 0

    # Systolic BP (AHA categories)
    points += _score_vital(row["systolic"], [(119, 0), (129, 1), (139, 2), (179, 3), (10_000, 5)])
    # Diastolic BP
    points += _score_vital(row["diastolic"], [(79, 0), (89, 2), (119, 3), (10_000, 5)])
    # Blood sugar (fasting-style bands, mg/dL)
    points += _score_vital(row["bloodSugar"], [(99, 0), (125, 1), (199, 2), (300, 4), (10_000, 5)])
    # Heart rate — risk rises at both extremes
    hr = row["heartRate"]
    if hr < 40 or hr > 150:
        points += 5
    elif hr < 50 or hr > 120:
        points += 3
    elif hr < 60 or hr > 100:
        points += 1
    # SpO2 — risk rises sharply below 92
    points += _score_vital(100 - row["spo2"], [(2, 0), (5, 2), (8, 4), (100, 6)])
    # Temperature (Celsius) — fever or hypothermia
    temp = row["temperature"]
    if temp >= 39.5 or temp <= 35.0:
        points += 4
    elif temp >= 38.0:
        points += 2
    elif temp >= 37.3:
        points += 1

    return points


def points_to_label(points, rng):
    # Soft thresholds with a little random jitter so the boundary isn't a
    # hard step function — this is what gives the trained model something
    # to generalize rather than just memorizing the rule.
    noisy = points + rng.normal(0, 1.1)
    if noisy < 3:
        return "Low"
    if noisy < 7:
        return "Moderate"
    if noisy < 13:
        return "High"
    return "Critical"


def generate_synthetic_dataset(n=12000, seed=42):
    rng = np.random.default_rng(seed)
    rows = []
    for _ in range(n):
        # Mixture of "mostly healthy" and "at risk" populations so classes aren't wildly imbalanced
        if rng.random() < 0.55:
            systolic = rng.normal(115, 10)
            diastolic = rng.normal(75, 7)
            blood_sugar = rng.normal(92, 10)
            heart_rate = rng.normal(72, 8)
            spo2 = rng.normal(98, 1.2)
            temperature = rng.normal(36.8, 0.3)
        else:
            systolic = rng.normal(145, 22)
            diastolic = rng.normal(90, 13)
            blood_sugar = rng.normal(150, 55)
            heart_rate = rng.normal(90, 22)
            spo2 = rng.normal(94, 4)
            temperature = rng.normal(37.4, 0.9)

        row = {
            "systolic": float(np.clip(systolic, 70, 220)),
            "diastolic": float(np.clip(diastolic, 40, 140)),
            "bloodSugar": float(np.clip(blood_sugar, 40, 500)),
            "heartRate": float(np.clip(heart_rate, 30, 200)),
            "spo2": float(np.clip(spo2, 70, 100)),
            "temperature": float(np.clip(temperature, 33, 42)),
        }
        points = rule_based_points(row)
        row["risk"] = points_to_label(points, rng)
        rows.append(row)

    return pd.DataFrame(rows)


def train():
    df = generate_synthetic_dataset()
    X = df[FEATURES]
    y = df["risk"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
    )
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    print(classification_report(y_test, preds, target_names=CLASSES))

    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model_artifacts")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "risk_model.joblib")

    joblib.dump({"model": clf, "features": FEATURES, "classes": list(clf.classes_), "defaults": NORMAL_DEFAULTS}, out_path)
    print(f"\nSaved model to {out_path}")


if __name__ == "__main__":
    train()
