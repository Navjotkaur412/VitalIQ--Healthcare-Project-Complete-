from fastapi import APIRouter, Depends
from ..security import verify_internal_key
from ..services import risk as risk_service
from ..services.data import get_doctor_patients, get_readings

router = APIRouter(prefix="/prioritization", tags=["prioritization"], dependencies=[Depends(verify_internal_key)])

LEVEL_RANK = {"Critical": 3, "High": 2, "Moderate": 1, "Low": 0}


@router.get("/{doctor_id}")
async def prioritize_patients(doctor_id: str):
    patients = await get_doctor_patients(doctor_id)

    results = []
    for p in patients:
        patient_id = str(p["_id"])
        readings = await get_readings(patient_id, limit=1)
        if not readings:
            results.append(
                {
                    "patientId": patient_id,
                    "name": p.get("name"),
                    "risk": None,
                    "hasData": False,
                }
            )
            continue

        risk = risk_service.predict_risk(readings[0])
        results.append(
            {
                "patientId": patient_id,
                "name": p.get("name"),
                "risk": risk,
                "hasData": True,
                "basedOn": readings[0]["recordedAt"],
            }
        )

    # Patients with no data sort last; among the rest, highest risk first, then lowest confidence-adjusted score
    results.sort(
        key=lambda r: (
            0 if r["hasData"] else 1,
            -LEVEL_RANK.get(r["risk"]["level"], -1) if r["hasData"] else 0,
            -r["risk"]["score"] if r["hasData"] else 0,
        )
    )

    return {"success": True, "count": len(results), "patients": results}
