import numpy as np
from sklearn.linear_model import LinearRegression

VITALS = ["systolic", "diastolic", "bloodSugar", "heartRate", "spo2", "temperature", "weight"]

# "Normal center" for vitals where risk is about distance-from-normal rather
# than a simple higher-is-worse/lower-is-worse direction (heart rate and
# temperature). For the rest, `HIGHER_IS_WORSE` says which direction of
# movement is the bad one.
NORMAL_CENTER = {"heartRate": 72, "temperature": 36.8}
HIGHER_IS_WORSE = {"systolic": True, "diastolic": True, "bloodSugar": True, "spo2": False, "weight": None}

# Minimum absolute slope (per day) to call it a trend rather than noise.
NOISE_FLOOR = {
    "systolic": 0.3,
    "diastolic": 0.2,
    "bloodSugar": 0.5,
    "heartRate": 0.3,
    "spo2": 0.1,
    "temperature": 0.02,
    "weight": 0.03,
}


def _slope(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    X = np.arange(len(values)).reshape(-1, 1)
    y = np.array(values)
    model = LinearRegression().fit(X, y)
    return float(model.coef_[0])


def analyze_trend(readings: list[dict]) -> dict:
    """
    readings: chronological (oldest first) list of readings with recordedAt + vitals.
    Returns per-vital direction classification plus an overall rollup.
    """
    result = {}
    directions_seen = []

    for vital in VITALS:
        series = [r[vital] for r in readings if r.get(vital) is not None]
        if len(series) < 3:
            result[vital] = {"direction": "insufficient_data", "slope": None, "dataPoints": len(series)}
            continue

        slope = _slope(series)
        floor = NOISE_FLOOR.get(vital, 0.1)

        if abs(slope) < floor:
            direction = "stable"
        elif vital in NORMAL_CENTER:
            # Moving away from normal center = worsening, toward it = improving
            center = NORMAL_CENTER[vital]
            last_val, first_val = series[-1], series[0]
            direction = "improving" if abs(last_val - center) < abs(first_val - center) else "worsening"
        else:
            higher_is_worse = HIGHER_IS_WORSE.get(vital)
            if higher_is_worse is None:  # weight — direction is neutral, just report movement
                direction = "increasing" if slope > 0 else "decreasing"
            else:
                worsening = (slope > 0) == higher_is_worse
                direction = "worsening" if worsening else "improving"

        result[vital] = {"direction": direction, "slope": round(slope, 3), "dataPoints": len(series)}
        if direction in ("improving", "worsening"):
            directions_seen.append(direction)

    if not directions_seen:
        overall = "stable"
    elif directions_seen.count("worsening") > directions_seen.count("improving"):
        overall = "worsening"
    elif directions_seen.count("improving") > directions_seen.count("worsening"):
        overall = "improving"
    else:
        overall = "mixed"

    return {"perVital": result, "overall": overall}
