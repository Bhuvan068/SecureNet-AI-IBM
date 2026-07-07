import csv
from typing import List, Dict, Any

class CSVConnector:
    def parse(self, file_content: str) -> List[Dict[str, Any]]:
        # Mock normalization logic
        lines = file_content.splitlines()
        reader = csv.DictReader(lines)
        events = []
        for row in reader:
            events.append({
                "source_type": "CSV",
                "protocol": row.get("protocol_type", "tcp"),
                "service": row.get("service", "http"),
                "payload": row
            })
        return events

csv_connector = CSVConnector()
