from fastapi import APIRouter, Depends, HTTPException
from ..security import verify_internal_key
from ..services import risk as risk_service
from ..services.anomaly import detect_anomalies
from ..services.trend import analyze_trend
from ..services.what_changed import compare_periods
from ..services.summary import generate_summary
from ..services.insights import generate_insights
from ..services.data import get_readings

router = APIRouter(prefix="/analysis", tags=["analysis"], dependencies=[Depends(verify_internal_key)])


@router.get("/{patient_id}")
async def get_full_analysis(patient_id: str):
    readings = await get_readings(patient_id, limit=200)
    if not readings:
        return {
            "success": True,
            "hasData": False,
            "message": "No health readings recorded yet for this patient.",
        }

    latest, history = readings[0], readings[1:]
    chronological = list(reversed(readings))

    risk = risk_service.predict_risk(latest)
    anomalies = detect_anomalies(history, latest)
    trend = analyze_trend(chronological)
    what_changed = compare_periods(readings[:3], readings[3:6], n=3)
    insights = generate_insights(risk, trend, anomalies, latest)
    summary = await generate_summary(risk, trend, anomalies, what_changed)

    return {
        "success": True,
        "hasData": True,
        "basedOn": latest["recordedAt"],
        "risk": risk,
        "anomalies": anomalies,
        "trend": trend,
        "whatChanged": what_changed,
        "insights": insights,
        "summary": summary,
    }
