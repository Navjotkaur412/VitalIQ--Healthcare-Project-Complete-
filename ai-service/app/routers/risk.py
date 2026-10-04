from fastapi import APIRouter, Depends, HTTPException
from ..security import verify_internal_key
from ..services import risk as risk_service
from ..services.data import get_readings, to_object_id
from ..database import health_readings, ai_predictions
from ..models.schemas import ComputeRiskRequest
from datetime import datetime, timezone

router = APIRouter(prefix="/risk", tags=["risk"], dependencies=[Depends(verify_internal_key)])


@router.post("/{patient_id}/compute")
async def compute_risk(patient_id: str, body: ComputeRiskRequest | None = None):
    """
    Scores a reading for this patient. If an explicit reading is given in the
    body, that's scored. Otherwise the patient's latest stored reading is
    used. The result is written back onto that HealthReading document
    (aiRiskScore / aiRiskLevel) and logged to the aipredictions audit collection.
    """
    readings = await get_readings(patient_id, limit=1)
    target_reading_id = None

    if body and any(v is not None for v in body.model_dump().values()):
        reading_dict = body.model_dump()
    elif readings:
        reading_dict = readings[0]
        target_reading_id = readings[0]["id"]
    else:
        raise HTTPException(status_code=404, detail="No readings found for this patient and none provided")

    result = risk_service.predict_risk(reading_dict)

    if target_reading_id:
        await health_readings.update_one(
            {"_id": to_object_id(target_reading_id)},
            {"$set": {"aiRiskScore": result["score"], "aiRiskLevel": result["level"]}},
        )

    await ai_predictions.insert_one(
        {
            "patient": to_object_id(patient_id),
            "type": "risk",
            "result": result,
            "createdAt": datetime.now(timezone.utc),
        }
    )

    return {"success": True, "risk": result}


@router.get("/{patient_id}/latest")
async def get_latest_risk(patient_id: str):
    readings = await get_readings(patient_id, limit=1)
    if not readings:
        return {"success": True, "risk": None, "message": "No readings yet"}

    result = risk_service.predict_risk(readings[0])
    return {"success": True, "risk": result, "basedOn": readings[0]["recordedAt"]}
