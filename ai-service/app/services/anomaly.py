import numpy as np
import pandas as pd

VITALS = ["systolic", "diastolic", "bloodSugar", "heartRate", "spo2", "temperature", "weight"]

# A hard clinical floor/ceiling per vital — even if a patient's own history
# is unusually volatile (low baseline std), a reading outside these bounds
# is always flagged. Prevents the z-score check from being too lenient for
# patients with naturally noisy vitals.
ABSOLUTE_BOUNDS = {
    "systolic": (85, 180),
    "diastolic": (50, 115),
    "bloodSugar": (55, 250),
    "heartRate": (45, 130),
    "spo2": (90, 100),
    "temperature": (35.5, 38.5),
}

Z_THRESHOLD = 2.2


def detect_anomalies(readings: list[dict], latest: dict) -> dict:
    """
    readings: historical readings (excluding `latest`), most recent first, used to build the baseline.
    latest: the reading being evaluated.

    For each vital present on `latest`, flags it as anomalous if either:
      - it falls outside the absolute clinical bound, OR
      - the patient has enough history (>=5 points) and it's a statistical
        outlier (|z-score| > threshold) against their own recent baseline.
    """
    df = pd.DataFrame(readings) if readings else pd.DataFrame(columns=VITALS)
    anomalies = []

    for vital in VITALS:
        value = latest.get(vital)
        if value is None:
            continue
        value = float(value)

        flagged = False
        reason = None

        bound = ABSOLUTE_BOUNDS.get(vital)
        if bound and not (bound[0] <= value <= bound[1]):
            flagged = True
            reason = f"Outside the safe clinical range ({bound[0]}–{bound[1]})"

        if not flagged and vital in df.columns:
            series = df[vital].dropna()
            if len(series) >= 5:
                mean, std = series.mean(), series.std()
                if std and std > 0:
                    z = (value - mean) / std
                    if abs(z) > Z_THRESHOLD:
                        flagged = True
                        direction = "higher" if z > 0 else "lower"
                        reason = f"{abs(round(z, 1))}σ {direction} than this patient's recent average ({round(mean, 1)})"

        if flagged:
            anomalies.append({"vital": vital, "value": value, "reason": reason})

    return {"anomalyCount": len(anomalies), "anomalies": anomalies, "isAnomalous": len(anomalies) > 0}
