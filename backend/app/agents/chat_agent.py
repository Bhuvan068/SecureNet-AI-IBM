"""
Chat Agent — Conversational SOC assistant powered by IBM Granite.
Falls back to a rule-based Q&A engine when credentials are absent.
"""
from __future__ import annotations

import logging
import re
import json
from typing import Optional, Dict, Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are SecureNet AI, an expert Security Operations Center (SOC) assistant. "
    "You help analysts understand network intrusion detections, explain anomalies, "
    "suggest mitigations, and answer cybersecurity questions. "
    "Be concise, professional, and actionable. "
    "CRITICAL RULE: If the user asks about Math, Physics, Politics, Sports, Weather, or anything outside of cybersecurity, "
    "you MUST respond strictly with: 'I am the SecureNet AI SOC Copilot. I can only answer cybersecurity, SOC, threat analysis... related questions.'"
)

# ─── Rule-based fallback ─────────────────────────────────────────────────────

_FAQ: list[tuple[str, str]] = [
    (
        r"explain.*anomal|why.*anomal|what.*anomal",
        "An anomaly indicates traffic that significantly deviates from normal baselines. "
        "The AutoAI model detected statistical outliers in connection features such as byte counts, "
        "error rates, and connection patterns that match known intrusion signatures.",
    ),
    (
        r"dos|denial.of.service|ddos",
        "DoS (Denial of Service) attacks flood a target with traffic to exhaust resources. "
        "Indicators include extremely high src_bytes, elevated serror_rate, and count > 200. "
        "Recommended response: block source IP, apply rate limiting, activate DDoS scrubbing.",
    ),
    (
        r"r2l|remote.to.local",
        "R2L attacks involve an external attacker gaining local access. "
        "Key indicators: multiple failed logins, unauthenticated data transfers. "
        "Action: block IP, audit sessions, enforce MFA.",
    ),
    (
        r"u2r|privilege.escal|root.shell",
        "U2R (User-to-Root) attacks escalate from user to administrator. "
        "Indicators: root_shell=1, su_attempted=1, num_shells>0. "
        "Action: isolate host immediately and revoke credentials.",
    ),
    (
        r"probe|port.scan|scan",
        "Port probing involves systematically connecting to multiple services to enumerate vulnerabilities. "
        "High serror_rate combined with large count is typical. "
        "Action: temporarily block source IP and correlate with threat feeds.",
    ),
    (
        r"confidence|score|percent",
        "The confidence score represents the model's certainty in its prediction. "
        "Values above 95% indicate very high certainty. "
        "The AutoAI model uses ensemble methods trained on the KDD-99 intrusion dataset.",
    ),
    (
        r"mitigat|action|remediat|fix|block",
        "Mitigation strategies depend on attack type. General steps: "
        "1) Block source IP, 2) Apply rate limiting, 3) Update IDS signatures, "
        "4) Notify SOC team, 5) Collect evidence, 6) Escalate if critical.",
    ),
    (
        r"histor|previous|similar|past",
        "Historical comparison searches the SQLite incident database using cosine similarity "
        "across 35 network features. If a past incident exceeds 70% similarity, the previous "
        "mitigation strategy is retrieved and reuse is recommended.",
    ),
    (
        r"report|incident.report|soc.report",
        "Incident reports are generated automatically after each detection. They include: "
        "prediction result, confidence, attack type, severity, historical comparison, "
        "mitigation plan, and status. Reports are stored in the database.",
    ),
    (
        r"normal|safe|benign",
        "Normal traffic is traffic that matches expected operational patterns. "
        "The model has not detected any indicators of compromise in these packets. "
        "Continue standard monitoring.",
    ),
]


def _rule_based_response(message: str, context: Optional[Dict[str, Any]] = None) -> str:
    msg = message.lower()
    
    if any(x in msg for x in ["math", "physics", "politics", "sports", "weather"]):
        return "I am the SecureNet AI SOC Copilot. I can only answer cybersecurity, SOC, threat analysis... related questions."

    for pattern, response in _FAQ:
        if re.search(pattern, msg):
            # Augment with live context if available
            if context and context.get("incident_id"):
                response += f"\n\nContext: Incident {context['incident_id']}"
                if context.get("attack_type"):
                    response += f" | Attack: {context['attack_type']}"
                if context.get("confidence"):
                    response += f" | Confidence: {context['confidence']:.1f}%"
            return response

    return (
        "I'm your SecureNet AI SOC assistant. I can help you:\n"
        "• Explain anomalies and attack types\n"
        "• Review mitigation strategies\n"
        "• Analyse historical incidents\n"
        "• Generate and interpret incident reports\n"
        "• Answer questions about network security\n\n"
        "Try asking: 'Explain this DoS attack', 'What mitigations should I apply?', "
        "'Show similar historical attacks', or 'Explain the confidence score'."
    )


class ChatAgent:
    """Conversational SOC assistant."""

    async def chat(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        # Check context for dashboard queries
        msg_lower = message.lower()
        context = context or {}
        
        try:
            from app.database import AsyncSessionLocal
            from sqlalchemy import text
            async with AsyncSessionLocal() as db:
                if any(x in msg_lower for x in ["alert", "critical"]):
                    alerts = (await db.execute(text("SELECT severity, trigger FROM alerts ORDER BY timestamp DESC LIMIT 5"))).fetchall()
                    context["recent_alerts"] = [{"severity": a[0], "trigger": a[1]} for a in alerts]
                if any(x in msg_lower for x in ["trend", "heatmap"]):
                    trends = (await db.execute(text("SELECT prediction, COUNT(*) FROM incidents GROUP BY prediction"))).fetchall()
                    context["trends"] = [{"prediction": t[0], "count": t[1]} for t in trends]
                if any(x in msg_lower for x in ["agent", "latency", "analytics"]):
                    perf = (await db.execute(text("SELECT agent_name, AVG(execution_time_ms) as avg_ms FROM audit_logs GROUP BY agent_name"))).fetchall()
                    context["agent_performance"] = [{"agent": p[0], "avg_latency_ms": round(p[1], 1)} for p in perf]
        except Exception as e:
            logger.error(f"Failed to fetch DB context for chat: {e}")

        if not settings.IBM_API_KEY or (not settings.IBM_PROJECT_ID and not getattr(settings, 'IBM_SPACE_ID', None)):
            logger.info("ChatAgent: Missing credentials. Using rule-based fallback.")
            return _rule_based_response(message, context)

        try:
            return await self._call_granite(message, context)
        except Exception as exc:
            logger.error("ChatAgent: Granite call failed with exception: %s", exc, exc_info=True)
            return _rule_based_response(message, context)

    async def _call_granite(
        self,
        message: str,
        context: Optional[Dict[str, Any]],
    ) -> str:
        from app.agents.detection_agent import DetectionAgent

        token = await DetectionAgent()._get_iam_token()
        url   = f"{settings.IBM_WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"

        ctx_text = ""
        if context:
            ctx_text = f"\n\nCurrent System Data Context: {json.dumps(context)}\n"

        # Proper Granite 4 / 3.0 prompt instruction format
        prompt = (
            f"<|start_of_role|>system<|end_of_role|>\n{_SYSTEM_PROMPT}<|end_of_text|>\n"
            f"<|start_of_role|>user<|end_of_role|>\n{message}{ctx_text}<|end_of_text|>\n"
            f"<|start_of_role|>assistant<|end_of_role|>\n"
        )

        body: Dict[str, Any] = {
            "model_id": settings.GRANITE_MODEL_ID,
            "input": prompt,
            "parameters": {
                "max_new_tokens": 600,
                "temperature": 0.3,
            }
        }
        
        # Use Space ID if available, otherwise fallback to Project ID
        if getattr(settings, "IBM_SPACE_ID", None):
            body["space_id"] = settings.IBM_SPACE_ID
        else:
            body["project_id"] = settings.IBM_PROJECT_ID

        logger.info(f"ChatAgent: Calling model_id={settings.GRANITE_MODEL_ID} at URL={url}")
        logger.debug(f"ChatAgent: Request Body: {json.dumps(body)}")

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url,
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            
            logger.info(f"ChatAgent: Response Status Code: {resp.status_code}")
            logger.debug(f"ChatAgent: Response JSON: {resp.text}")
            
            if not resp.is_success:
                logger.error(f"ChatAgent: Watsonx API Error: {resp.text}")
                resp.raise_for_status()
                
            return resp.json()["results"][0]["generated_text"].strip()


chat_agent = ChatAgent()
