import logging
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ThreatIntelligence
from app.schemas import NetworkFeatures, ThreatReasoning

logger = logging.getLogger(__name__)

class ThreatIntelAgent:
    """
    Threat Intelligence Agent maps incidents to MITRE ATT&CK, CWE, CVE,
    and calculates threat reputation scores.
    """

    async def analyze(self, db: AsyncSession, incident_id: str, features: NetworkFeatures, reasoning: ThreatReasoning) -> Dict[str, Any]:
        logger.info(f"ThreatIntelAgent: Analyzing {incident_id} for {reasoning.attack_type}")

        # Basic mock mappings for the POC
        attack = reasoning.attack_type.upper()
        
        mitre = "T1078"
        cwe = "CWE-287"
        cve = ["CVE-2023-0001"]
        reputation = 5.0
        iocs = {"ip": "Unknown", "port": "Unknown"}

        if "DOS" in attack:
            mitre = "T1498"
            cwe = "CWE-400"
            cve = ["CVE-2024-XXXX"]
            reputation = 9.5
            iocs = {"ip": "Multiple", "port": features.service}
        elif "PROBE" in attack:
            mitre = "T1046"
            cwe = "CWE-200"
            cve = []
            reputation = 6.5
            iocs = {"port": features.service}
        elif "R2L" in attack:
            mitre = "T1190"
            cwe = "CWE-89"
            cve = ["CVE-2021-44228"]
            reputation = 9.8
            iocs = {"protocol": features.protocol_type}
        elif "U2R" in attack:
            mitre = "T1068"
            cwe = "CWE-269"
            cve = ["CVE-2021-3156"]
            reputation = 9.9
            iocs = {"process": "sudo"}

        intel = ThreatIntelligence(
            incident_id=incident_id,
            attack_type=reasoning.attack_type,
            mitre_technique=mitre,
            cwe_id=cwe,
            cve_references=cve,
            iocs=iocs,
            reputation_score=reputation
        )
        db.add(intel)
        
        return {
            "mitre": mitre,
            "cwe": cwe,
            "cve": cve,
            "reputation": reputation,
            "iocs": iocs
        }

threat_intel_agent = ThreatIntelAgent()
