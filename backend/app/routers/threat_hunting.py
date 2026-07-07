from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional

from app.database import get_db
from app.models import Incident

router = APIRouter(prefix="/api/threat-hunting", tags=["threat-hunting"])

@router.get("/search")
async def search_threats(
    query: str,
    severity: Optional[str] = None,
    protocol: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Search incidents. Mocked for POC.
    """
    stmt = select(Incident)
    
    if severity:
        stmt = stmt.filter(Incident.severity == severity)
    if protocol:
        stmt = stmt.filter(Incident.protocol == protocol)
        
    result = await db.execute(stmt)
    incidents = result.scalars().all()
    
    # Simple text filter
    filtered = [i for i in incidents if query.lower() in str(i.attack_type).lower() or query.lower() in str(i.threat_reasoning).lower()]
    
    return filtered
