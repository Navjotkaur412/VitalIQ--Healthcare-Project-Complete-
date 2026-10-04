from fastapi import APIRouter, Depends, HTTPException
from ..security import verify_internal_key
from ..services.anomaly import detect_anomalies
from ..services.data import get_readings

router = APIRouter(prefix="/anomalies", tags=["anomaly"], dependencies=[Depends(verify_internal_key)])


@router.get("/{patient_id}")
async def get_anomalies(patient_id: str):
    readings = await get_readings(patient_id, limit=31)
    if not readings:
        raise HTTPException(status_code=404, detail="No readings found for this patient")

    latest, history = readings[0], readings[1:]
    result = detect_anomalies(history, latest)
    return {"success": True, **result, "basedOn": latest["recordedAt"]}
