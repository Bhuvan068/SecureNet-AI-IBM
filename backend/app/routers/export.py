from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Incident
import json

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/{incident_id}")
async def export_report(
    incident_id: str,
    format: str = "json",
    db: AsyncSession = Depends(get_db)
):
    """
    Export incident report. Supported formats: json, txt, csv (mocked).
    """
    result = await db.execute(select(Incident).filter(Incident.incident_id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    data = {
        "Incident": incident.incident_id,
        "Attack": incident.attack_type,
        "Severity": incident.severity,
        "Prediction": incident.prediction,
        "Risk": incident.risk_level,
        "Status": incident.status,
        "Report": incident.report
    }
    
    if format == "json":
        return data
    elif format == "txt":
        content = "\n".join([f"{k}: {v}" for k, v in data.items()])
        return Response(content=content, media_type="text/plain")
    else:
        # Fallback to json
        return data
