from fastapi import FastAPI
from .routers import risk, anomaly, trend, what_changed, summary, insights, prioritization, assistant, admin_stats, analysis

app = FastAPI(
    title="VitalIQ AI Service",
    description="Phase 3: risk prediction, anomaly detection, trend analysis, AI summaries, "
    "and a RAG-backed doctor assistant. Internal-only — called by the Node backend, never "
    "directly by the browser.",
    version="1.0.0",
)

app.include_router(risk.router)
app.include_router(anomaly.router)
app.include_router(trend.router)
app.include_router(what_changed.router)
app.include_router(summary.router)
app.include_router(insights.router)
app.include_router(prioritization.router)
app.include_router(assistant.router)
app.include_router(admin_stats.router)
app.include_router(analysis.router)


@app.get("/health")
async def health_check():
    return {"success": True, "message": "VitalIQ AI service is running"}
