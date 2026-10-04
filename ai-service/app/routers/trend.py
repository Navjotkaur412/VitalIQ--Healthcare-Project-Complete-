from fastapi import APIRouter, Depends, Query
from ..security import verify_internal_key
from ..services.trend import analyze_trend
from ..services.data import get_readings

router = APIRouter(prefix="/trend", tags=["trend"], dependencies=[Depends(verify_internal_key)])


@router.get("/{patient_id}")
async def get_trend(patient_id: str, days: int = Query(30, ge=3, le=180)):
    readings = await get_readings(patient_id, limit=200)
    # readings are most-recent-first; trend analysis wants chronological order
    chronological = list(reversed(readings))
    result = analyze_trend(chronological)
    return {"success": True, **result, "dataPoints": len(chronological)}
