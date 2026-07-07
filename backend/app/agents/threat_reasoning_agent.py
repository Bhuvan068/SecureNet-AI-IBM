"""
Threat Reasoning Agent — Uses IBM Granite (watsonx.ai) to produce
human-readable threat analysis. Falls back to a rule-based engine
when credentials are absent.
"""
from __future__ import annotations

import logging
import json
import re
from typing import List

import httpx

from app.config import settings
from app.schemas import DetectionResult, NetworkFeatures, ThreatReasoning

logger = logging.getLogger(__name__)

# ─── Rule-based fallback ─────────────────────────────────────────────────────

_ATTACK_HEURISTICS = [
    {
        "name": "DoS (Denial of Service)",
        "check": lambda f: f.src_bytes > 50000 or f.count > 200 or f.serror_rate > 0.5,
        "indicators": [
            "High outbound packet volume",
            "Elevated connection count",
            "High SYN error rate",
        ],
        "severity": "CRITICAL",
    },
    {
        "name": "R2L (Remote-to-Local)",
        "check": lambda f: f.num_failed_logins > 2 or f.logged_in == 0 and f.dst_bytes > 1000,
        "indicators": [
            "Multiple failed login attempts",
            "Unauthenticated data transfer",
            "Possible credential brute-force",
        ],
        "severity": "HIGH",
    },
    {
        "name": "U2R (User-to-Root Privilege Escalation)",
        "check": lambda f: f.root_shell == 1 or f.su_attempted == 1 or f.num_shells > 0,
        "indicators": [
            "Root shell obtained",
            "su/sudo attempt detected",
            "Shell spawned during session",
        ],
        "severity": "CRITICAL",
    },
    {
        "name": "Probe / Port Scan",
        "check": lambda f: f.serror_rate > 0.7 and f.count > 50,
        "indicators": [
            "Sequential port probing pattern",
            "High SYN error rate with large connection count",
            "Service enumeration behaviour",
        ],
        "severity": "MEDIUM",
    },
    {
        "name": "Land Attack",
        "check": lambda f: f.land == 1,
        "indicators": ["Source IP equals destination IP (land condition)"],
        "severity": "HIGH",
    },
    {
        "name": "Anomalous Network Behaviour",
        "check": lambda f: True,  # default
        "indicators": ["Unusual traffic pattern detected by AutoAI model"],
        "severity": "MEDIUM",
    },
]


def _rule_based_reasoning(features: NetworkFeatures, detection: DetectionResult) -> ThreatReasoning:
    if detection.prediction == "NORMAL":
        return ThreatReasoning(
            attack_type="Normal Traffic",
            indicators=["Traffic characteristics within expected parameters"],
            severity="LOW",
            reasoning=(
                "The analysed network traffic conforms to normal operational patterns. "
                "No indicators of compromise were detected. "
                f"Model confidence: {detection.confidence:.1f}%."
            ),
        )

    matched = None
    for rule in _ATTACK_HEURISTICS:
        if rule["check"](features):
            matched = rule
            break

    attack_type = matched["name"]
    indicators  = matched["indicators"]
    severity    = matched["severity"]

    reasoning = (
        f"The AutoAI model classified this traffic as an anomaly with "
        f"{detection.confidence:.1f}% confidence (risk: {detection.risk_level}). "
        f"Pattern analysis suggests a {attack_type} attack. "
        f"Key indicators: {', '.join(indicators)}. "
        f"Immediate investigation is recommended."
    )

    return ThreatReasoning(
        attack_type=attack_type,
        indicators=indicators,
        severity=severity,
        reasoning=reasoning,
    )


# ─── IBM Granite integration ──────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are an expert cybersecurity analyst. Analyse the provided network traffic "
    "detection result and produce a structured threat assessment. "
    "Respond ONLY with valid JSON matching this schema:\n"
    '{"attack_type": "string", "indicators": ["string"], "severity": "LOW|MEDIUM|HIGH|CRITICAL", "reasoning": "string"}'
)


def _build_user_prompt(features: NetworkFeatures, detection: DetectionResult) -> str:
    return (
        f"Detection result: {detection.prediction} (confidence {detection.confidence:.1f}%, "
        f"risk {detection.risk_level}).\n"
        f"Traffic features summary:\n"
        f"  protocol={features.protocol_type}, service={features.service}, flag={features.flag}\n"
        f"  src_bytes={features.src_bytes}, dst_bytes={features.dst_bytes}\n"
        f"  serror_rate={features.serror_rate}, rerror_rate={features.rerror_rate}\n"
        f"  count={features.count}, srv_count={features.srv_count}\n"
        f"  root_shell={features.root_shell}, num_failed_logins={features.num_failed_logins}\n"
        f"  land={features.land}, num_shells={features.num_shells}\n"
        f"Provide threat reasoning as JSON."
    )


class ThreatReasoningAgent:
    """Calls IBM Granite or falls back to rule-based reasoning."""

    async def analyse(
        self, features: NetworkFeatures, detection: DetectionResult
    ) -> ThreatReasoning:
        if not settings.IBM_API_KEY or not settings.IBM_PROJECT_ID:
            logger.info("ThreatReasoningAgent: using rule-based fallback")
            return _rule_based_reasoning(features, detection)

        try:
            return await self._call_granite(features, detection)
        except Exception as exc:
            logger.error("ThreatReasoningAgent: Granite call failed – %s", exc)
            return _rule_based_reasoning(features, detection)

    async def _call_granite(
        self, features: NetworkFeatures, detection: DetectionResult
    ) -> ThreatReasoning:
        from app.agents.detection_agent import DetectionAgent

        token = await DetectionAgent()._get_iam_token()
        url   = f"{settings.IBM_WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"

        body = {
            "model_id": settings.GRANITE_MODEL_ID,
            "input": (
                f"<|system|>\n{_SYSTEM_PROMPT}\n<|user|>\n"
                f"{_build_user_prompt(features, detection)}\n<|assistant|>\n"
            ),
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 512,
                "temperature": 0.1,
            },
            "project_id": settings.IBM_PROJECT_ID,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url,
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            text = resp.json()["results"][0]["generated_text"].strip()

        # Extract JSON from response
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON found in Granite response")

        data = json.loads(match.group())
        return ThreatReasoning(
            attack_type=data.get("attack_type", "Unknown"),
            indicators=data.get("indicators", []),
            severity=data.get("severity", "MEDIUM"),
            reasoning=data.get("reasoning", text),
        )


threat_reasoning_agent = ThreatReasoningAgent()
