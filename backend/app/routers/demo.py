from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.demo_engine import demo_engine

router = APIRouter(prefix="/api/demo", tags=["demo"])

@router.post("/run")
async def run_demo(scenario: str, db: AsyncSession = Depends(get_db)):
    result = await demo_engine.run_scenario(db, scenario)
    return result
