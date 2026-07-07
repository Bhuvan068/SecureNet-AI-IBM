import logging
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models import AgentPerformanceMetric
from app.schemas import AgentMetricOut, AgentTrendPoint, AgentErrorAnalysis, AgentThroughputPoint, AgentAnalyticsResponse

logger = logging.getLogger(__name__)

class AnalyticsAgent:
    """Agent Analytics Engine responsible for tracking agent performance and generating metrics."""
    
    AGENTS = [
        "Observer Agent",
        "Detection Agent",
        "Reasoning Agent",
        "Historical Agent",
        "Mitigation Agent",
        "Report Agent",
        "Threat Intel Agent"
    ]

    @staticmethod
    async def log_execution(
        db: AsyncSession,
        agent_name: str,
        incident_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        execution_time_ms: float = 0.0,
        confidence_score: float = 0.0,
        success: bool = True,
        error_message: Optional[str] = None,
    ):
        metric = AgentPerformanceMetric(
            metric_id=str(uuid.uuid4()),
            agent_name=agent_name,
            incident_id=incident_id,
            organization_id=organization_id,
            execution_time_ms=execution_time_ms,
            confidence_score=confidence_score,
            success=success,
            error_message=error_message,
        )
        db.add(metric)
        await db.commit()

    @staticmethod
    async def generate_demo_data(db: AsyncSession):
        """Generate synthetic analytics data for 500 incidents across 30 days if DB is empty."""
        count = await db.scalar(select(func.count()).select_from(AgentPerformanceMetric))
        if count and count > 0:
            return # Data already exists

        logger.info("AnalyticsAgent: Generating demo data for Agent Performance...")
        now = datetime.now(timezone.utc)
        metrics = []

        for _ in range(500):
            days_ago = random.uniform(0, 30)
            incident_time = now - timedelta(days=days_ago)
            incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"

            for agent in AnalyticsAgent.AGENTS:
                success = random.random() > 0.05 # 5% failure rate
                exec_time = random.uniform(50, 500) if agent != "Detection Agent" else random.uniform(200, 1500)
                if not success:
                    exec_time += random.uniform(1000, 3000)
                
                confidence = random.uniform(70, 100) if success else random.uniform(0, 50)
                error_msg = random.choice(["Connection Timeout", "API Rate Limit", "Invalid Payload", "Model Unavailable"]) if not success else None

                # Slight time offset per agent in flow
                agent_time = incident_time + timedelta(milliseconds=random.uniform(100, 1000))

                metric = AgentPerformanceMetric(
                    metric_id=str(uuid.uuid4()),
                    agent_name=agent_name,
                    incident_id=incident_id,
                    execution_time_ms=exec_time,
                    confidence_score=confidence,
                    success=success,
                    error_message=error_msg,
                    timestamp=agent_time
                )
                metrics.append(metric)

        db.add_all(metrics)
        await db.commit()
        logger.info(f"AnalyticsAgent: Generated {len(metrics)} demo metrics.")

    @staticmethod
    async def get_metrics(db: AsyncSession) -> AgentAnalyticsResponse:
        # We will fetch everything and process in python for this demo
        result = await db.execute(select(AgentPerformanceMetric))
        records = result.scalars().all()
        
        agent_stats: Dict[str, Dict] = {}
        for agent in AnalyticsAgent.AGENTS:
            agent_stats[agent] = {
                "total": 0, "success": 0, "failed": 0, 
                "times": [], "confidences": [], "errors": {}
            }
            
        trends_map = {}
        throughput_map = {}
        
        now = datetime.now(timezone.utc)
        
        for r in records:
            if r.agent_name not in agent_stats:
                agent_stats[r.agent_name] = {"total": 0, "success": 0, "failed": 0, "times": [], "confidences": [], "errors": {}}
            
            stat = agent_stats[r.agent_name]
            stat["total"] += 1
            if r.success:
                stat["success"] += 1
            else:
                stat["failed"] += 1
                if r.error_message:
                    stat["errors"][r.error_message] = stat["errors"].get(r.error_message, 0) + 1
            
            stat["times"].append(r.execution_time_ms)
            stat["confidences"].append(r.confidence_score)
            
            # Trend calculation
            if r.timestamp:
                day_str = r.timestamp.strftime("%Y-%m-%d")
                t_key = f"{day_str}_{r.agent_name}"
                if t_key not in trends_map:
                    trends_map[t_key] = {"timestamp": day_str, "agent_name": r.agent_name, "sum_conf": 0, "count": 0}
                trends_map[t_key]["sum_conf"] += r.confidence_score
                trends_map[t_key]["count"] += 1
                
                # Throughput (requests per hour for simplicity, or per minute if recent)
                hr_str = r.timestamp.strftime("%Y-%m-%d %H:00")
                throughput_map[hr_str] = throughput_map.get(hr_str, 0) + 1

        metrics_out = []
        errors_out = []
        for name, s in agent_stats.items():
            if s["total"] == 0:
                continue
            times = sorted(s["times"])
            p95_idx = int(len(times) * 0.95)
            p99_idx = int(len(times) * 0.99)
            metrics_out.append(AgentMetricOut(
                agent_name=name,
                total_executions=s["total"],
                successful_executions=s["success"],
                failed_executions=s["failed"],
                success_rate=s["success"]/s["total"]*100,
                failure_rate=s["failed"]/s["total"]*100,
                avg_response_time_ms=sum(times)/len(times) if times else 0,
                median_response_time_ms=times[len(times)//2] if times else 0,
                p95_latency_ms=times[p95_idx] if p95_idx < len(times) else 0,
                p99_latency_ms=times[p99_idx] if p99_idx < len(times) else 0,
                avg_confidence=sum(s["confidences"])/len(s["confidences"]) if s["confidences"] else 0,
                max_confidence=max(s["confidences"]) if s["confidences"] else 0,
                min_confidence=min(s["confidences"]) if s["confidences"] else 0,
                daily_count=s["total"]//30, # approx for demo
                weekly_count=(s["total"]//30)*7,
                monthly_count=s["total"]
            ))
            
            for err_msg, count in s["errors"].items():
                errors_out.append(AgentErrorAnalysis(
                    error_message=err_msg,
                    count=count,
                    frequency=count/s["total"]*100
                ))

        trends_out = [
            AgentTrendPoint(
                timestamp=v["timestamp"],
                agent_name=v["agent_name"],
                value=v["sum_conf"]/v["count"]
            )
            for v in trends_map.values()
        ]
        
        throughput_out = [
            AgentThroughputPoint(timestamp=k, requests_per_minute=v)
            for k, v in sorted(throughput_map.items())[-30:] # Last 30 points
        ]
        
        # Build relationship graph nodes
        rel_graph = [
            {"source": "Observer", "target": "Detection", "value": 100},
            {"source": "Detection", "target": "Reasoning", "value": 100},
            {"source": "Reasoning", "target": "Threat Intel", "value": 100},
            {"source": "Threat Intel", "target": "Historical", "value": 100},
            {"source": "Historical", "target": "Risk", "value": 100},
            {"source": "Risk", "target": "Mitigation", "value": 100},
            {"source": "Mitigation", "target": "Report", "value": 100},
        ]

        return AgentAnalyticsResponse(
            metrics=metrics_out,
            trends=sorted(trends_out, key=lambda x: x.timestamp),
            errors=sorted(errors_out, key=lambda x: x.count, reverse=True),
            throughput=throughput_out,
            relationship_graph=rel_graph
        )

analytics_agent = AnalyticsAgent()
