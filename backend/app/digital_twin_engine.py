from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import DigitalAsset

class DigitalTwinEngine:
    async def get_network_topology(self, db: AsyncSession, organization_id: str) -> Dict[str, Any]:
        result = await db.execute(select(DigitalAsset).filter_by(organization_id=organization_id))
        assets = result.scalars().all()
        
        # Simple mocked linear or star topology
        nodes = [{"id": a.asset_id, "label": a.asset_name, "status": a.status, "risk": a.risk_score} for a in assets]
        nodes.insert(0, {"id": "internet", "label": "Internet", "status": "Safe", "risk": 0})
        
        edges = []
        for i in range(len(nodes) - 1):
            edges.append({"source": nodes[i]["id"], "target": nodes[i+1]["id"]})
            
        return {
            "nodes": nodes,
            "edges": edges
        }
        
    async def simulate_attack_path(self, db: AsyncSession, organization_id: str, incident_id: str) -> List[Dict[str, Any]]:
        # Returns an animated sequence
        topology = await self.get_network_topology(db, organization_id)
        nodes = topology["nodes"]
        
        timeline = []
        for i, node in enumerate(nodes):
            timeline.append({
                "step": i,
                "node_id": node["id"],
                "node_label": node["label"],
                "action": "propagating" if i < len(nodes) -1 else "detected",
                "status_change": "High Risk"
            })
            
        return timeline

digital_twin_engine = DigitalTwinEngine()
