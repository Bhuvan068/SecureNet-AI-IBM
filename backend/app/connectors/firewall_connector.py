from typing import List, Dict, Any

class FirewallConnector:
    def parse(self, file_content: str) -> List[Dict[str, Any]]:
        # Mock firewall logic
        events = []
        for line in file_content.splitlines():
            events.append({
                "source_type": "FIREWALL",
                "protocol": "tcp",
                "service": "unknown",
                "payload": {"raw": line}
            })
        return events

firewall_connector = FirewallConnector()
