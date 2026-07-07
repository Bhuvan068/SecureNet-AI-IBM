from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.soc_copilot_agent import soc_copilot_agent

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def copilot_chat(req: ChatRequest):
    response = await soc_copilot_agent.chat(req.message)
    return {"response": response}
