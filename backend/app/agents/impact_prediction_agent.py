import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ImpactPrediction

class ImpactPredictionAgent:
    """
    Counterfactual Predictor: What would have happened without mitigation?
    """
    async def predict_impact(self, db: AsyncSession, incident_id: str, severity: str, mitigation_success: float) -> Dict[str, Any]:
        pred_id = f"IMP-{uuid.uuid4().hex[:6].upper()}"
        
        # Heuristics for the POC
        if severity == "CRITICAL":
            downtime = "4 hours"
            risk = 95.0
            services = 5
            recovery = "8 hours"
        elif severity == "HIGH":
            downtime = "1 hour"
            risk = 80.0
            services = 2
            recovery = "3 hours"
        else:
            downtime = "15 minutes"
            risk = 40.0
            services = 0
            recovery = "None"
            
        prediction = ImpactPrediction(
            prediction_id=pred_id,
            incident_id=incident_id,
            predicted_downtime=downtime,
            predicted_risk=risk,
            predicted_services=services,
            predicted_severity=severity,
            predicted_recovery=recovery
        )
        db.add(prediction)
        
        return {
            "prediction_id": pred_id,
            "downtime": downtime,
            "services": services,
            "risk": risk
        }

impact_prediction_agent = ImpactPredictionAgent()
