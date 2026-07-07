import logging
import hashlib
import json
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ForensicRecord
from app.schemas import NetworkFeatures, ThreatReasoning

logger = logging.getLogger(__name__)

class ForensicsAgent:
    """
    Digital Forensics Agent preserves evidence, stores packet metadata,
    and generates attack fingerprints (SHA256).
    """

    async def preserve(self, db: AsyncSession, incident_id: str, raw_features: Dict[str, Any], reasoning: ThreatReasoning) -> Dict[str, Any]:
        logger.info(f"ForensicsAgent: Preserving evidence for {incident_id}")

        # Generate SHA256 fingerprint from the raw features
        feature_string = json.dumps(raw_features, sort_keys=True)
        fingerprint = hashlib.sha256(feature_string.encode('utf-8')).hexdigest()

        # Build basic timeline
        timeline = [
            {"time": "+0s", "event": "Detection"},
            {"time": "+1s", "event": "Analysis"},
            {"time": "+2s", "event": "Mitigation Started"}
        ]

        record = ForensicRecord(
            incident_id=incident_id,
            evidence_metadata={"source": "autoai_pipeline"},
            packet_snapshot=raw_features,
            sha256_fingerprint=fingerprint,
            timeline=timeline
        )
        db.add(record)
        
        return {
            "fingerprint": fingerprint,
            "timeline": timeline,
            "evidence_saved": True
        }

forensics_agent = ForensicsAgent()
