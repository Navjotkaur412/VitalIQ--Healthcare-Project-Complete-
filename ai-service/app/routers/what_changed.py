from fastapi import APIRouter, Depends
from ..security import verify_internal_key
from ..services.what_changed import compare_periods
from ..services.data import get_readings

router = APIRouter(prefix="/what-changed", tags=["what-changed"], dependencies=[Depends(verify_internal_key)])


@router.get("/{patient_id}")
async def get_what_changed(patient_id: str):
    readings = await get_readings(patient_id, limit=6)
    recent, previous = readings[:3], readings[3:6]
    result = compare_periods(recent, previous, n=3)
    return {"success": True, **result}
