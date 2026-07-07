import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import XAIReport
from app.schemas import NetworkFeatures

class XAIAgent:
    """
    Explainability Agent (XAI). Provides transparent explanations for AutoAI classifications.
    """
    async def explain(self, db: AsyncSession, incident_id: str, prediction: str, confidence: float, features: NetworkFeatures, historical_sim: float) -> Dict[str, Any]:
        xai_id = f"XAI-{uuid.uuid4().hex[:6].upper()}"
        
        # Mocking top features calculation based on simple rules or dataset averages
        is_anomaly = prediction == "ANOMALY"
        top_features = ["service", "flag", "src_bytes", "srv_count", "dst_host_count"]
        feature_scores = [0.34, 0.21, 0.18, 0.14, 0.13]
        
        if is_anomaly:
            decision_path = ["High connection volume", "Repeated service requests", "Abnormal packet behavior", "Attack pattern similarity", "ANOMALY"]
            explanation = "This traffic was classified as anomalous because it exhibits high packet volume, repeated service requests, and abnormal protocol behavior consistent with previously observed attacks."
        else:
            decision_path = ["Normal connection volume", "Standard service requests", "NORMAL"]
            explanation = "This traffic aligns with baseline network profiles and exhibits no malicious signatures."

        report = XAIReport(
            xai_id=xai_id,
            incident_id=incident_id,
            prediction=prediction,
            confidence=confidence,
            top_features=top_features,
            feature_scores=feature_scores,
            decision_path=decision_path,
            explanation=explanation,
            historical_similarity=historical_sim
        )
        db.add(report)
        
        return {
            "xai_id": xai_id,
            "explanation": explanation,
            "decision_path": decision_path
        }

xai_agent = XAIAgent()
