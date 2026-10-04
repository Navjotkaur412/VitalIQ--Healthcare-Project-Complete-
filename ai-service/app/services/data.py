from bson import ObjectId
from bson.errors import InvalidId
from ..database import health_readings, users

VITALS = ["systolic", "diastolic", "bloodSugar", "heartRate", "spo2", "temperature", "weight"]


def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise ValueError(f"'{id_str}' is not a valid ObjectId")


def serialize_reading(doc: dict) -> dict:
    out = {"id": str(doc["_id"]), "recordedAt": doc.get("recordedAt")}
    for v in VITALS:
        out[v] = doc.get(v)
    return out


async def get_readings(patient_id: str, limit: int = 60) -> list[dict]:
    """Most-recent-first list of serialized readings."""
    cursor = health_readings.find({"patient": to_object_id(patient_id)}).sort("recordedAt", -1).limit(limit)
    return [serialize_reading(doc) async for doc in cursor]


async def get_patient(patient_id: str) -> dict | None:
    return await users.find_one({"_id": to_object_id(patient_id)})


async def get_doctor_patients(doctor_id: str) -> list[dict]:
    cursor = users.find({"role": "patient", "assignedDoctor": to_object_id(doctor_id)})
    return [doc async for doc in cursor]
