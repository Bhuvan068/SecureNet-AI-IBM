import logging
import random
import uuid
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ScenarioGenerator:
    """
    Incident Scenario Generator creates synthetic incident records for SOC training,
    testing mitigation workflows, and agent reasoning.
    """

    def generate_scenario(self, type_hint: str = None) -> Dict[str, Any]:
        scenario_id = f"SCENARIO-{uuid.uuid4().hex[:6].upper()}"
        
        types = ["DOS", "PROBE", "R2L", "U2R", "ANOMALY"]
        attack_type = type_hint.upper() if type_hint and type_hint.upper() in types else random.choice(types)
        
        severity_map = {
            "DOS": "HIGH",
            "PROBE": "MEDIUM",
            "R2L": "CRITICAL",
            "U2R": "CRITICAL",
            "ANOMALY": "LOW"
        }
        severity = severity_map.get(attack_type, "MEDIUM")

        # Fake features for training
        features = {
            "duration": random.randint(0, 100),
            "protocol_type": random.choice(["tcp", "udp", "icmp"]),
            "service": random.choice(["http", "ftp", "ssh", "dns"]),
            "flag": "SF",
            "src_bytes": random.randint(100, 50000),
            "dst_bytes": random.randint(0, 5000),
            "count": random.randint(1, 500)
        }

        success_prob = random.uniform(70.0, 99.9)

        return {
            "scenario_id": scenario_id,
            "incident_type": attack_type,
            "severity": severity,
            "expected_outcome": "RESOLVED" if success_prob > 80 else "ESCALATED",
            "mitigation_success_probability": round(success_prob, 2),
            "mock_features": features
        }

scenario_generator = ScenarioGenerator()
