from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models import SOCCase
import uuid

router = APIRouter(prefix="/api/cases", tags=["cases"])

@router.get("/")
async def list_cases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SOCCase))
    return result.scalars().all()

@router.post("/")
async def create_case(incident_id: str, db: AsyncSession = Depends(get_db)):
    new_case = SOCCase(
        case_id=f"CASE-{uuid.uuid4().hex[:6].upper()}",
        incident_id=incident_id
    )
    db.add(new_case)
    await db.commit()
    await db.refresh(new_case)
    return new_case

@router.put("/{case_id}/status")
async def update_status(case_id: str, status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SOCCase).filter(SOCCase.case_id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    case.status = status
    await db.commit()
    return case
