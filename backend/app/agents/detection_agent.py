"""
Detection Agent — Authenticates with IBM IAM and calls the
AutoAI-deployed Network Intrusion Detection model.
Falls back to a local heuristic when credentials are absent.
"""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, Tuple

import httpx

from app.config import settings
from app.schemas import NetworkFeatures, DetectionResult

logger = logging.getLogger(__name__)

_IAM_TOKEN_CACHE: Dict[str, Any] = {"token": None, "expires_at": 0}

PROTOCOL_MAP = {"tcp": 0, "udp": 1, "icmp": 2}
FLAG_MAP = {
    "SF": 0, "S0": 1, "REJ": 2, "RSTO": 3, "RSTOS0": 4,
    "RSTR": 5, "S1": 6, "S2": 7, "S3": 8, "OTH": 9, "SH": 10,
}


def _encode_features(f: NetworkFeatures) -> list:
    """Convert NetworkFeatures to ordered numeric list for AutoAI."""
    return [
        f.duration,
        PROTOCOL_MAP.get(f.protocol_type.lower(), 0),
        hash(f.service) % 100,           # simple label encoding
        FLAG_MAP.get(f.flag.upper(), 0),
        f.src_bytes,
        f.dst_bytes,
        f.land,
        f.wrong_fragment,
        f.urgent,
        f.hot,
        f.num_failed_logins,
        f.logged_in,
        f.num_compromised,
        f.root_shell,
        f.su_attempted,
        f.num_root,
        f.num_file_creations,
        f.num_shells,
        f.num_access_files,
        f.num_outbound_cmds,
        f.is_host_login,
        f.is_guest_login,
        f.count,
        f.srv_count,
        f.serror_rate,
        f.srv_serror_rate,
        f.rerror_rate,
        f.srv_rerror_rate,
        f.same_srv_rate,
        f.diff_srv_rate,
        f.srv_diff_host_rate,
        f.dst_host_count,
        f.dst_host_srv_count,
        f.dst_host_same_srv_rate,
        f.dst_host_diff_srv_rate,
        f.dst_host_same_src_port_rate,
        f.dst_host_srv_diff_host_rate,
        f.dst_host_serror_rate,
        f.dst_host_srv_serror_rate,
        f.dst_host_rerror_rate,
        f.dst_host_srv_rerror_rate,
    ]


def _risk_level(confidence: float, prediction: str) -> str:
    if prediction == "NORMAL":
        return "LOW"
    if confidence >= 0.95:
        return "CRITICAL"
    if confidence >= 0.80:
        return "HIGH"
    if confidence >= 0.60:
        return "MEDIUM"
    return "LOW"


def _heuristic_detect(f: NetworkFeatures) -> Tuple[str, float]:
    """
    Local fallback detection when IBM credentials are not configured.
    Uses domain heuristics from the KDD-99 dataset.
    """
    score = 0.0

    if f.src_bytes > 50000:
        score += 0.3
    if f.dst_bytes == 0 and f.src_bytes > 1000:
        score += 0.2
    if f.serror_rate > 0.5 or f.dst_host_serror_rate > 0.5:
        score += 0.25
    if f.count > 200:
        score += 0.15
    if f.root_shell == 1 or f.su_attempted == 1:
        score += 0.4
    if f.num_failed_logins > 3:
        score += 0.2
    if f.wrong_fragment > 0:
        score += 0.15
    if f.hot > 10:
        score += 0.1
    if f.num_shells > 0:
        score += 0.3
    if f.land == 1:
        score += 0.35
    if f.rerror_rate > 0.5:
        score += 0.2
    if f.same_srv_rate < 0.1 and f.count > 100:
        score += 0.15

    score = min(score, 1.0)
    prediction = "ANOMALY" if score >= 0.35 else "NORMAL"
    confidence = score if prediction == "ANOMALY" else (1.0 - score)
    return prediction, round(confidence, 4)


class DetectionAgent:
    """Calls IBM AutoAI or falls back to heuristic detection."""

    async def _get_iam_token(self) -> str:
        now = time.time()
        if _IAM_TOKEN_CACHE["token"] and _IAM_TOKEN_CACHE["expires_at"] > now + 60:
            return _IAM_TOKEN_CACHE["token"]

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                settings.IBM_IAM_URL,
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": settings.IBM_API_KEY,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            data = resp.json()
            token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            _IAM_TOKEN_CACHE["token"] = token
            _IAM_TOKEN_CACHE["expires_at"] = now + expires_in
            return token

    async def detect(self, features: NetworkFeatures) -> DetectionResult:
        if not settings.IBM_API_KEY or not settings.IBM_DEPLOYMENT_URL:
            logger.warning("DetectionAgent: IBM credentials absent – using heuristic fallback")
            prediction, confidence = _heuristic_detect(features)
        else:
            prediction, confidence = await self._call_autoai(features)

        risk = _risk_level(confidence, prediction)
        logger.info("DetectionAgent: %s  confidence=%.2f  risk=%s", prediction, confidence, risk)
        return DetectionResult(
            prediction=prediction,
            confidence=round(confidence * 100, 2),
            risk_level=risk,
        )

    async def _call_autoai(self, features: NetworkFeatures) -> Tuple[str, float]:
        try:
            token = await self._get_iam_token()
            encoded = _encode_features(features)

            payload = {
                "input_data": [
                    {
                        "fields": [
                            "duration", "protocol_type", "service", "flag",
                            "src_bytes", "dst_bytes", "land", "wrong_fragment",
                            "urgent", "hot", "num_failed_logins", "logged_in",
                            "num_compromised", "root_shell", "su_attempted", "num_root",
                            "num_file_creations", "num_shells", "num_access_files",
                            "num_outbound_cmds", "is_host_login", "is_guest_login",
                            "count", "srv_count", "serror_rate", "srv_serror_rate",
                            "rerror_rate", "srv_rerror_rate", "same_srv_rate",
                            "diff_srv_rate", "srv_diff_host_rate", "dst_host_count",
                            "dst_host_srv_count", "dst_host_same_srv_rate",
                            "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
                            "dst_host_srv_diff_host_rate", "dst_host_serror_rate",
                            "dst_host_srv_serror_rate", "dst_host_rerror_rate",
                            "dst_host_srv_rerror_rate",
                        ],
                        "values": [encoded],
                    }
                ]
            }

            url = f"{settings.IBM_DEPLOYMENT_URL}/ml/v4/deployments/{settings.IBM_DEPLOYMENT_ID}/predictions?version=2021-05-01"

            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                result = resp.json()

            predictions = result["predictions"][0]["values"][0]
            label = str(predictions[0]).upper()
            prediction = "ANOMALY" if label not in ("NORMAL", "0") else "NORMAL"

            # Extract probability if available
            try:
                probs = predictions[1]
                confidence = max(probs) if isinstance(probs, list) else 0.9
            except (IndexError, TypeError):
                confidence = 0.9

            return prediction, confidence

        except Exception as exc:
            logger.error("DetectionAgent: AutoAI call failed – %s  (falling back to heuristic)", exc)
            return _heuristic_detect(features)


detection_agent = DetectionAgent()
