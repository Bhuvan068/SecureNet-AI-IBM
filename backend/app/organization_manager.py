import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Organization, DigitalAsset

class OrganizationManager:
    async def create_organization(self, db: AsyncSession, name: str, org_type: str, description: str = "") -> Organization:
        org_id = f"ORG-{uuid.uuid4().hex[:6].upper()}"
        org = Organization(
            organization_id=org_id,
            organization_name=name,
            organization_type=org_type,
            description=description
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
        # Provision default digital assets
        assets_map = {
            "Home Network": ["Router", "Laptop", "Mobile", "IoT Devices"],
            "College Network": ["Firewall", "Campus Servers", "Student Network", "WiFi Infrastructure"],
            "Startup Company": ["Cloud Servers", "Web Applications", "Employee Systems"],
            "Enterprise SOC": ["SIEM", "Firewalls", "Data Centers", "Endpoints"]
        }
        
        asset_names = assets_map.get(org_type, ["Gateway", "Internal Network"])
        
        for asset in asset_names:
            da = DigitalAsset(
                asset_id=f"AST-{uuid.uuid4().hex[:6].upper()}",
                organization_id=org_id,
                asset_name=asset,
                asset_type="Endpoint" if "Laptop" in asset or "Mobile" in asset else "Network",
                ip_address="192.168.1.1" # Mock
            )
            db.add(da)
        
        await db.commit()
        return org

organization_manager = OrganizationManager()
