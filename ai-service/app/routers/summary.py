from fastapi import APIRouter, Depends, HTTPException
from ..security import verify_internal_key
from ..services import risk as risk_service
from ..services.anomaly import detect_anomalies
from ..services.trend import analyze_trend
from ..services.what_changed import compare_periods
from ..services.summary import generate_summary
from ..services.data import get_readings

router = APIRouter(prefix="/summary", tags=["summary"], dependencies=[Depends(verify_internal_key)])


@router.get("/{patient_id}")
async def get_summary(patient_id: str):
    readings = await get_readings(patient_id, limit=200)
    if not readings:
        raise HTTPException(status_code=404, detail="No readings found for this patient")

    latest, history = readings[0], readings[1:]
    chronological = list(reversed(readings))

    risk = risk_service.predict_risk(latest)
    anomalies = detect_anomalies(history, latest)
    trend = analyze_trend(chronological)
    what_changed = compare_periods(readings[:3], readings[3:6], n=3)

    result = await generate_summary(risk, trend, anomalies, what_changed)
    return {"success": True, **result}
