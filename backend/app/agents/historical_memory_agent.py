"""
Historical Memory Agent — SQLite-backed incident store.
Searches past incidents for similar attacks and retrieves
previous mitigation strategies.
"""
from __future__ import annotations

import logging
import math
from typing import List, Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident
from app.schemas import (
    NetworkFeatures,
    DetectionResult,
    ThreatReasoning,
    HistoricalMatch,
)

logger = logging.getLogger(__name__)

# Weights for cosine similarity over numeric features
_NUMERIC_FIELDS = [
    "duration", "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent",
    "hot", "num_failed_logins", "logged_in", "num_compromised", "root_shell",
    "su_attempted", "num_root", "num_file_creations", "num_shells",
    "num_access_files", "count", "srv_count", "serror_rate", "srv_serror_rate",
    "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
    "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
]

SIMILARITY_THRESHOLD = 0.70  # 70 %


def _feature_vector(features: NetworkFeatures) -> List[float]:
    return [float(getattr(features, f, 0)) for f in _NUMERIC_FIELDS]


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot   = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _attack_type_bonus(current: str, historical: str) -> float:
    """Boost similarity if attack types match."""
    c = current.lower()
    h = historical.lower()
    if c == h:
        return 0.15
    for keyword in ["dos", "probe", "r2l", "u2r", "land", "ddos"]:
        if keyword in c and keyword in h:
            return 0.10
    return 0.0


class HistoricalMemoryAgent:
    """Searches incident history for pattern-matching incidents."""

    async def search(
        self,
        db: AsyncSession,
        features: NetworkFeatures,
        reasoning: ThreatReasoning,
    ) -> HistoricalMatch:
        # Fetch recent anomaly incidents (max 200 for performance)
        stmt = (
            select(Incident)
            .where(Incident.prediction == "ANOMALY")
            .order_by(desc(Incident.timestamp))
            .limit(200)
        )
        result  = await db.execute(stmt)
        history = result.scalars().all()

        if not history:
            logger.info("HistoricalMemoryAgent: no historical incidents found")
            return HistoricalMatch(found=False)

        current_vec = _feature_vector(features)
        best_score  = 0.0
        best_match: Optional[Incident] = None

        for incident in history:
            raw = incident.raw_features or {}
            try:
                hist_features = NetworkFeatures(**raw)
                hist_vec      = _feature_vector(hist_features)
            except Exception:
                continue

            sim = _cosine_similarity(current_vec, hist_vec)
            sim += _attack_type_bonus(reasoning.attack_type, incident.attack_type)
            sim  = min(sim, 1.0)

            if sim > best_score:
                best_score = sim
                best_match = incident

        if best_match and best_score >= SIMILARITY_THRESHOLD:
            logger.info(
                "HistoricalMemoryAgent: match %s  similarity=%.2f",
                best_match.incident_id,
                best_score,
            )
            return HistoricalMatch(
                found=True,
                incident_id=best_match.incident_id,
                similarity_score=round(best_score * 100, 1),
                previous_attack=best_match.attack_type,
                previous_mitigation=best_match.mitigation_strategy,
                outcome=best_match.status,
            )

        return HistoricalMatch(found=False, similarity_score=round(best_score * 100, 1))


historical_memory_agent = HistoricalMemoryAgent()
