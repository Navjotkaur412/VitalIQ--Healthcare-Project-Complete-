from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
try:
    db = client.get_default_database()
except Exception:
    db = client.get_database("vitaliq")

# Collection handles matching the Mongoose collection names (pluralized, lowercased)
users = db["users"]
health_readings = db["healthreadings"]
medications = db["medications"]
medication_logs = db["medicationlogs"]
appointments = db["appointments"]
ai_predictions = db["aipredictions"]  # Phase 3's own audit trail of model runs
