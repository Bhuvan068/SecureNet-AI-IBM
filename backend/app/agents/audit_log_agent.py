"""
Audit Log Agent — Records every agent execution step with timing,
inputs/outputs, confidence, and error tracing.
"""
from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog

logger = logging.getLogger(__name__)


def _make_log_id() -> str:
    return f"LOG-{uuid.uuid4().hex[:12].upper()}"


def _safe_json(obj: Any) -> Any:
    """Strip non-serialisable values before storing as JSON."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _safe_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_safe_json(i) for i in obj]
    # Pydantic models
    if hasattr(obj, "model_dump"):
        return _safe_json(obj.model_dump())
    return str(obj)


class AuditLogAgent:
    """
    Wraps agent calls to measure execution time and persist audit records.

    Usage (async context manager):

        async with audit_log_agent.track(db, incident_id, "DetectionAgent",
                                          input_data={...}) as ctx:
            result = await detection_agent.detect(features)
            ctx["output"] = result
            ctx["confidence"] = result.confidence / 100
    """

    @asynccontextmanager
    async def track(
        self,
        db: AsyncSession,
        incident_id: Optional[str],
        agent_name: str,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        ctx: Dict[str, Any] = {
            "output":     None,
            "decision":   None,
            "confidence": 0.0,
            "error":      None,
        }
        t_start = time.perf_counter()
        status = "SUCCESS"
        error_msg: Optional[str] = None

        try:
            yield ctx
        except Exception as exc:
            status = "FAILED"
            error_msg = str(exc)
            ctx["error"] = error_msg
            logger.error("AuditLogAgent: %s failed – %s", agent_name, exc)
            raise
        finally:
            elapsed_ms = (time.perf_counter() - t_start) * 1000

            log = AuditLog(
                log_id=_make_log_id(),
                incident_id=incident_id,
                agent_name=agent_name,
                input_data=_safe_json(input_data),
                output_data=_safe_json(ctx.get("output")),
                decision=str(ctx.get("decision") or ""),
                confidence=float(ctx.get("confidence") or 0.0),
                execution_time_ms=round(elapsed_ms, 2),
                status=status,
                error_message=error_msg,
            )
            try:
                db.add(log)
                await db.flush()
                logger.debug(
                    "AuditLog: %s  agent=%s  %.1f ms  %s",
                    log.log_id, agent_name, elapsed_ms, status,
                )
            except Exception as db_exc:
                logger.error("AuditLogAgent: DB write failed – %s", db_exc)

    async def log_direct(
        self,
        db: AsyncSession,
        incident_id: Optional[str],
        agent_name: str,
        input_data: Any = None,
        output_data: Any = None,
        decision: str = "",
        confidence: float = 0.0,
        execution_time_ms: float = 0.0,
        status: str = "SUCCESS",
        error_message: Optional[str] = None,
    ) -> None:
        """Direct (non-context-manager) audit write."""
        log = AuditLog(
            log_id=_make_log_id(),
            incident_id=incident_id,
            agent_name=agent_name,
            input_data=_safe_json(input_data),
            output_data=_safe_json(output_data),
            decision=decision,
            confidence=confidence,
            execution_time_ms=round(execution_time_ms, 2),
            status=status,
            error_message=error_message,
        )
        db.add(log)
        try:
            await db.flush()
        except Exception as exc:
            logger.error("AuditLogAgent: direct write failed – %s", exc)


audit_log_agent = AuditLogAgent()
