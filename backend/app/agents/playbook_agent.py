"""
Playbook Agent — SOC Incident Response Playbook Engine.
Generates step-by-step response playbooks for each attack type.
"""
from __future__ import annotations

from typing import Any, Dict, List

# ─── Playbook Library ─────────────────────────────────────────────────────────

_PLAYBOOKS: Dict[str, Dict[str, Any]] = {
    "DoS (Denial of Service)": {
        "threat": "DoS / DDoS",
        "steps": [
            {"step": 1, "action": "Identify source IPs generating excessive traffic",            "tool": "Firewall / NetFlow",   "status": "PENDING"},
            {"step": 2, "action": "Block offending source IPs at border firewall",               "tool": "Firewall ACL",         "status": "PENDING"},
            {"step": 3, "action": "Apply rate-limiting on affected ingress interface",           "tool": "Router QoS",           "status": "PENDING"},
            {"step": 4, "action": "Activate upstream DDoS scrubbing / null-route",              "tool": "ISP / CDN",            "status": "PENDING"},
            {"step": 5, "action": "Update IDS/IPS signatures to match attack pattern",          "tool": "IDS Console",          "status": "PENDING"},
            {"step": 6, "action": "Enable enhanced packet capture for forensics",               "tool": "Wireshark / tcpdump",  "status": "PENDING"},
            {"step": 7, "action": "Notify NOC and SOC Tier-2 analysts",                        "tool": "Ticketing System",     "status": "PENDING"},
            {"step": 8, "action": "Monitor traffic for 30 minutes post-mitigation",             "tool": "SIEM",                 "status": "PENDING"},
            {"step": 9, "action": "Document incident and update threat intelligence feed",      "tool": "SecureNet AI",         "status": "PENDING"},
        ],
        "escalation": "Escalate to CISO if attack continues > 15 minutes.",
        "kpis": ["Time to block: < 5 min", "Service restore: < 30 min", "Documentation: < 2 hrs"],
    },
    "Probe / Port Scan": {
        "threat": "Probe / Reconnaissance",
        "steps": [
            {"step": 1, "action": "Identify scanning source IP and port pattern",               "tool": "IDS Logs",             "status": "PENDING"},
            {"step": 2, "action": "Temporarily block source IP (auto-expire 24h)",              "tool": "Firewall",             "status": "PENDING"},
            {"step": 3, "action": "Review scanned ports — correlate with CVE database",         "tool": "Vuln Scanner",         "status": "PENDING"},
            {"step": 4, "action": "Patch or close any unnecessarily exposed services",          "tool": "Change Management",    "status": "PENDING"},
            {"step": 5, "action": "Increase IDS sensitivity for this source subnet",            "tool": "IDS Console",          "status": "PENDING"},
            {"step": 6, "action": "Cross-reference with threat intelligence feeds",             "tool": "Threat Intel",         "status": "PENDING"},
            {"step": 7, "action": "Log and report to SOC analyst",                             "tool": "SIEM",                 "status": "PENDING"},
        ],
        "escalation": "Escalate if scan originates from known APT infrastructure.",
        "kpis": ["Response time: < 10 min", "Port closure: < 1 hr"],
    },
    "R2L (Remote-to-Local)": {
        "threat": "Remote-to-Local Intrusion",
        "steps": [
            {"step": 1, "action": "Block all connections from offending external IP",           "tool": "Firewall",             "status": "PENDING"},
            {"step": 2, "action": "Terminate all active sessions from that IP",                "tool": "Session Manager",      "status": "PENDING"},
            {"step": 3, "action": "Force password reset for potentially compromised accounts",  "tool": "IAM / AD",             "status": "PENDING"},
            {"step": 4, "action": "Audit authentication logs for past 48 hours",               "tool": "SIEM / Auth Logs",     "status": "PENDING"},
            {"step": 5, "action": "Enable MFA on all exposed authentication services",         "tool": "IAM",                  "status": "PENDING"},
            {"step": 6, "action": "Patch the targeted service or restrict access",             "tool": "Patch Management",     "status": "PENDING"},
            {"step": 7, "action": "Notify affected account owners",                            "tool": "Email",                "status": "PENDING"},
            {"step": 8, "action": "Review and harden external-facing service configurations",  "tool": "Config Management",    "status": "PENDING"},
        ],
        "escalation": "Escalate to CISO if data exfiltration suspected.",
        "kpis": ["Account lock: < 5 min", "Service patch: < 4 hrs", "Notify: < 1 hr"],
    },
    "U2R (User-to-Root Privilege Escalation)": {
        "threat": "Privilege Escalation (U2R)",
        "steps": [
            {"step": 1, "action": "IMMEDIATELY isolate compromised host from network",         "tool": "NAC / Switch",         "status": "PENDING"},
            {"step": 2, "action": "Terminate all active sessions on the host",                 "tool": "SSH / RDP",            "status": "PENDING"},
            {"step": 3, "action": "Revoke elevated privileges and audit sudo/SUID entries",    "tool": "OS / IAM",             "status": "PENDING"},
            {"step": 4, "action": "Forensic imaging of host disk and memory",                  "tool": "FTK / Volatility",     "status": "PENDING"},
            {"step": 5, "action": "Analyse /var/log/auth.log and audit.log",                   "tool": "Log Analyser",         "status": "PENDING"},
            {"step": 6, "action": "Check for persistence mechanisms (cron, systemd, etc.)",   "tool": "EDR",                  "status": "PENDING"},
            {"step": 7, "action": "Re-image host if compromise is confirmed",                  "tool": "IT Operations",        "status": "PENDING"},
            {"step": 8, "action": "Notify CISO and initiate full incident response",           "tool": "IRT",                  "status": "PENDING"},
            {"step": 9, "action": "Review and harden sudo/SUID configurations system-wide",   "tool": "Config Management",    "status": "PENDING"},
        ],
        "escalation": "Mandatory CISO notification. Treat as breach.",
        "kpis": ["Host isolation: < 2 min", "Forensics start: < 30 min", "Re-image: < 4 hrs"],
    },
    "Land Attack": {
        "threat": "Land Attack (IP Spoofing)",
        "steps": [
            {"step": 1, "action": "Apply firewall rule to drop packets with src IP = dst IP",  "tool": "Firewall",             "status": "PENDING"},
            {"step": 2, "action": "Enable anti-spoofing filters (uRPF) at border router",     "tool": "Router",               "status": "PENDING"},
            {"step": 3, "action": "Verify host-based firewall rules are active",               "tool": "Host Firewall",        "status": "PENDING"},
            {"step": 4, "action": "Restart network stack if service disruption occurs",        "tool": "OS",                   "status": "PENDING"},
            {"step": 5, "action": "Monitor and log recurrence over 24 hours",                  "tool": "SIEM",                 "status": "PENDING"},
        ],
        "escalation": "Escalate if spoofing originates from internal subnet.",
        "kpis": ["Rule deployment: < 5 min"],
    },
    "Normal Traffic": {
        "threat": "No Threat Detected",
        "steps": [
            {"step": 1, "action": "Continue standard monitoring",                              "tool": "SIEM",                 "status": "COMPLETED"},
            {"step": 2, "action": "Log event for baseline calibration",                       "tool": "SecureNet AI",         "status": "COMPLETED"},
        ],
        "escalation": "No escalation required.",
        "kpis": ["Standard SLA applies"],
    },
    "Anomalous Network Behaviour": {
        "threat": "Unknown Anomaly",
        "steps": [
            {"step": 1, "action": "Capture and preserve traffic samples",                      "tool": "Wireshark",            "status": "PENDING"},
            {"step": 2, "action": "Correlate with recent change management records",           "tool": "CMDB",                 "status": "PENDING"},
            {"step": 3, "action": "Engage threat hunting team for deeper analysis",            "tool": "EDR / XDR",            "status": "PENDING"},
            {"step": 4, "action": "Update detection model with new pattern",                   "tool": "SecureNet AI / AutoAI","status": "PENDING"},
            {"step": 5, "action": "Notify SOC analyst for manual review",                      "tool": "SIEM",                 "status": "PENDING"},
        ],
        "escalation": "Escalate to Tier-2 within 30 minutes if unresolved.",
        "kpis": ["Triage: < 15 min", "Escalation decision: < 30 min"],
    },
}

_DEFAULT_PLAYBOOK = _PLAYBOOKS["Anomalous Network Behaviour"]


class PlaybookAgent:
    """Generates and retrieves incident response playbooks."""

    def get_playbook(self, attack_type: str) -> Dict[str, Any]:
        # Try exact match first, then substring
        pb = _PLAYBOOKS.get(attack_type)
        if not pb:
            at_lower = attack_type.lower()
            for key, val in _PLAYBOOKS.items():
                if any(kw in at_lower for kw in key.lower().split()):
                    pb = val
                    break
        return pb or _DEFAULT_PLAYBOOK

    def list_playbooks(self) -> List[str]:
        return list(_PLAYBOOKS.keys())


playbook_agent = PlaybookAgent()
