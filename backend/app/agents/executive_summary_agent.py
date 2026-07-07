import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ExecutiveReport

class ExecutiveSummaryAgent:
    """
    Simulates IBM Granite generating an executive-friendly incident summary.
    """
    async def generate_summary(self, db: AsyncSession, incident_id: str, severity: str, attack_type: str, risk_score: float) -> Dict[str, Any]:
        # Mocking IBM Granite response
        impact_map = {
            "CRITICAL": "Potential disruption of critical network services and massive financial risk.",
            "HIGH": "Significant performance degradation and partial service outages.",
            "MEDIUM": "Minor service interruptions affecting external availability.",
            "LOW": "Negligible operational impact. Handled via automated filters."
        }
        business_impact = impact_map.get(severity.upper(), "Unknown impact.")
        
        recovery = "15 minutes" if severity != "CRITICAL" else "4+ hours"
        recommendation = "Apply predefined firewall mitigation immediately."
        
        report_id = f"RPT-{uuid.uuid4().hex[:6].upper()}"
        
        report = ExecutiveReport(
            report_id=report_id,
            incident_id=incident_id,
            summary=f"Automated detection of {attack_type} attack. Risk Level: {severity}.",
            business_impact=business_impact,
            recovery_estimate=recovery,
            risk_score=risk_score,
            recommendation=recommendation
        )
        db.add(report)
        
        return {
            "report_id": report_id,
            "business_impact": business_impact,
            "recovery_estimate": recovery,
            "recommendation": recommendation
        }

executive_summary_agent = ExecutiveSummaryAgent()
