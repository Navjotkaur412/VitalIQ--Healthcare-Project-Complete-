from fastapi import APIRouter, Depends
from ..security import verify_internal_key
from ..services.rag import ask_assistant
from ..services.llm import is_llm_configured
from ..models.schemas import AskRequest

router = APIRouter(prefix="/assistant", tags=["assistant"], dependencies=[Depends(verify_internal_key)])


@router.post("/ask")
async def ask(body: AskRequest):
    result = await ask_assistant(body.patientId, body.question)
    return {"success": True, **result}


@router.get("/status")
async def status():
    return {"success": True, "llmConfigured": is_llm_configured()}
