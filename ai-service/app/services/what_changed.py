import statistics

VITALS = ["systolic", "diastolic", "bloodSugar", "heartRate", "spo2", "temperature", "weight"]
LABELS = {
    "systolic": "Systolic BP",
    "diastolic": "Diastolic BP",
    "bloodSugar": "Blood sugar",
    "heartRate": "Heart rate",
    "spo2": "SpO₂",
    "temperature": "Temperature",
    "weight": "Weight",
}
UNITS = {
    "systolic": "mmHg",
    "diastolic": "mmHg",
    "bloodSugar": "mg/dL",
    "heartRate": "bpm",
    "spo2": "%",
    "temperature": "°C",
    "weight": "kg",
}

# Minimum absolute change to be worth mentioning
SIGNIFICANCE_FLOOR = {
    "systolic": 5,
    "diastolic": 4,
    "bloodSugar": 8,
    "heartRate": 6,
    "spo2": 1.5,
    "temperature": 0.3,
    "weight": 0.5,
}


def compare_periods(recent: list[dict], previous: list[dict], n: int = 3) -> dict:
    """
    recent: most recent readings, most-recent-first.
    previous: the readings before that (also most-recent-first).
    Compares the mean of the last `n` recent readings against the mean of
    the `n` readings before that, per vital.
    """
    recent_slice = recent[:n]
    previous_slice = previous[:n]

    changes = []
    for vital in VITALS:
        recent_vals = [r[vital] for r in recent_slice if r.get(vital) is not None]
        previous_vals = [r[vital] for r in previous_slice if r.get(vital) is not None]
        if not recent_vals or not previous_vals:
            continue

        recent_mean = statistics.fmean(recent_vals)
        previous_mean = statistics.fmean(previous_vals)
        delta = recent_mean - previous_mean

        if abs(delta) < SIGNIFICANCE_FLOOR.get(vital, 1):
            continue

        direction = "increased" if delta > 0 else "decreased"
        changes.append(
            {
                "vital": vital,
                "label": LABELS[vital],
                "unit": UNITS[vital],
                "previousAverage": round(previous_mean, 1),
                "recentAverage": round(recent_mean, 1),
                "delta": round(delta, 1),
                "direction": direction,
                "explanation": f"{LABELS[vital]} {direction} from an average of {round(previous_mean, 1)} to {round(recent_mean, 1)} {UNITS[vital]}.",
            }
        )

    return {
        "hasEnoughData": bool(recent_slice and previous_slice),
        "changeCount": len(changes),
        "changes": changes,
    }
