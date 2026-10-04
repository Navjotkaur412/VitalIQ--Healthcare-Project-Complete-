from pydantic import BaseModel


class AskRequest(BaseModel):
    patientId: str
    question: str


class ComputeRiskRequest(BaseModel):
    # Optional explicit reading to score; if omitted, the patient's latest stored reading is used
    systolic: float | None = None
    diastolic: float | None = None
    bloodSugar: float | None = None
    heartRate: float | None = None
    spo2: float | None = None
    temperature: float | None = None
