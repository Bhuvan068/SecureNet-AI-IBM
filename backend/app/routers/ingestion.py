from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import json

from app.database import get_db
from app.pipeline import run_pipeline

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest data from JSON logs (e.g. Suricata, Firewall, Sysmon).
    For POC, we accept JSON lists of network features.
    """
    contents = await file.read()
    
    try:
        data = json.loads(contents)
        if not isinstance(data, list):
            data = [data]
            
        results = []
        for feature_dict in data:
            result = await run_pipeline(feature_dict, db, source="file_upload")
            results.append(result)
            
        return {"status": "success", "processed_count": len(results), "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
