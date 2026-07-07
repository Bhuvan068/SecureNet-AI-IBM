"""
Mitigation Agent — Generates prioritised response plans based on
threat type, severity, and historical context.
"""
from __future__ import annotations

import logging
from typing import List

from app.schemas import (
    ThreatReasoning,
    DetectionResult,
    HistoricalMatch,
    MitigationPlan,
)

logger = logging.getLogger(__name__)

# ─── Strategy library ─────────────────────────────────────────────────────────

_STRATEGIES: dict = {
    "DoS (Denial of Service)": {
        "actions": [
            "Immediately block source IP at perimeter firewall.",
            "Apply rate-limiting rules on ingress interfaces.",
            "Activate upstream DDoS scrubbing / black-hole routing.",
            "Update IDS / IPS signatures for this traffic pattern.",
            "Notify SOC analysts and escalate to Tier-2.",
            "Enable enhanced monitoring on affected services.",
            "Collect packet captures for forensic analysis.",
        ],
        "priority": "CRITICAL",
    },
    "R2L (Remote-to-Local)": {
        "actions": [
            "Block all inbound connections from offending IP.",
            "Reset and audit all active user sessions.",
            "Force password reset for potentially compromised accounts.",
            "Review authentication logs for the past 24 hours.",
            "Enable multi-factor authentication on exposed services.",
            "Patch or restrict the targeted service.",
            "Notify account owners and security team.",
        ],
        "priority": "HIGH",
    },
    "U2R (User-to-Root Privilege Escalation)": {
        "actions": [
            "Immediately isolate the affected host from the network.",
            "Terminate all active sessions on the compromised host.",
            "Revoke elevated privileges and re-audit sudo rules.",
            "Perform forensic analysis of /var/log/auth.log and audit.log.",
            "Re-image the host if compromise is confirmed.",
            "Notify CISO and initiate incident response procedure.",
            "Review and harden sudo / SUID configurations system-wide.",
        ],
        "priority": "CRITICAL",
    },
    "Probe / Port Scan": {
        "actions": [
            "Block source IP temporarily (auto-expire in 24h).",
            "Log all scanned ports for vulnerability correlation.",
            "Ensure only necessary ports are exposed externally.",
            "Review firewall rules for unnecessary open services.",
            "Increase IDS alerting sensitivity for this source.",
            "Correlate with threat intelligence feeds.",
        ],
        "priority": "MEDIUM",
    },
    "Land Attack": {
        "actions": [
            "Drop all packets where source IP equals destination IP.",
            "Apply anti-spoofing filters at the border router.",
            "Verify host-based firewall rules.",
            "Restart affected network stack if service disruption occurs.",
        ],
        "priority": "HIGH",
    },
    "Normal Traffic": {
        "actions": ["No immediate action required. Continue standard monitoring."],
        "priority": "LOW",
    },
}

_DEFAULT_STRATEGY = {
    "actions": [
        "Block source IP at the firewall.",
        "Apply rate limiting on suspicious traffic.",
        "Update IDS signatures.",
        "Notify SOC analysts.",
        "Enable enhanced monitoring.",
        "Collect evidence for forensic review.",
        "Escalate based on business impact assessment.",
    ],
    "priority": "HIGH",
}


def _reuse_historical_actions(historical_mitigation: str) -> List[str]:
    return [
        f"REUSE PREVIOUS MITIGATION: {historical_mitigation}",
        "Verify that network conditions match previous incident.",
        "Apply the firewall rule / patch from the historical incident.",
        "Monitor for 30 minutes to confirm resolution.",
        "Update incident record with outcome.",
    ]


class MitigationAgent:
    """Generates a prioritised mitigation plan."""

    def generate(
        self,
        reasoning: ThreatReasoning,
        detection: DetectionResult,
        historical: HistoricalMatch,
    ) -> MitigationPlan:
        attack_type = reasoning.attack_type

        # If high-similarity historical match → prefer reuse strategy
        if historical.found and historical.similarity_score >= 85 and historical.previous_mitigation:
            logger.info("MitigationAgent: reusing historical mitigation (sim=%.1f%%)", historical.similarity_score)
            actions  = _reuse_historical_actions(historical.previous_mitigation)
            priority = "HIGH"
        else:
            strat    = _STRATEGIES.get(attack_type, _DEFAULT_STRATEGY)
            actions  = strat["actions"]
            priority = strat["priority"]

        # Override priority based on detection risk
        if detection.risk_level == "CRITICAL":
            priority = "CRITICAL"
        elif detection.risk_level == "HIGH" and priority not in ("CRITICAL",):
            priority = "HIGH"

        logger.info("MitigationAgent: %d actions  priority=%s", len(actions), priority)
        return MitigationPlan(
            actions=actions,
            priority=priority,
            estimated_severity=reasoning.severity,
        )


mitigation_agent = MitigationAgent()
