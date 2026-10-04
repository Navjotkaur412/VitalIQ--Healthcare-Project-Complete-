from fastapi import APIRouter, Depends
from ..security import verify_internal_key
from ..database import health_readings, ai_predictions

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(verify_internal_key)])


@router.get("/stats")
async def ai_admin_stats():
    pipeline = [
        {"$match": {"aiRiskLevel": {"$ne": None}}},
        {"$group": {"_id": "$aiRiskLevel", "count": {"$sum": 1}}},
    ]
    distribution = {doc["_id"]: doc["count"] async for doc in health_readings.aggregate(pipeline)}

    total_scored = sum(distribution.values())
    total_predictions_logged = await ai_predictions.count_documents({})

    avg_pipeline = [
        {"$match": {"aiRiskScore": {"$ne": None}}},
        {"$group": {"_id": None, "avgScore": {"$avg": "$aiRiskScore"}}},
    ]
    avg_result = [doc async for doc in health_readings.aggregate(avg_pipeline)]
    avg_score = round(avg_result[0]["avgScore"], 1) if avg_result else None

    return {
        "success": True,
        "stats": {
            "riskDistribution": {
                "Low": distribution.get("Low", 0),
                "Moderate": distribution.get("Moderate", 0),
                "High": distribution.get("High", 0),
                "Critical": distribution.get("Critical", 0),
            },
            "totalReadingsScored": total_scored,
            "totalPredictionsLogged": total_predictions_logged,
            "averageRiskScore": avg_score,
        },
    }
