"""
Observer Agent — Gate-keeper of the multi-agent pipeline.
Validates incoming network features or parsed file data,
creates a security event, and returns a normalised payload
ready for the Detection Agent.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List
from app.schemas import NetworkFeatures

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = [f.name for f in NetworkFeatures.model_fields.values()] if False else list(NetworkFeatures.model_fields.keys())

PROTOCOL_TYPES  = {"tcp", "udp", "icmp"}
SERVICE_TYPES   = {
    "http", "ftp", "smtp", "ssh", "dns", "ftp_data", "mtp", "finger",
    "telnet", "private", "domain_u", "auth", "login", "bgp", "ntp_u",
    "other", "pop_3", "pop_2", "imap4", "rje", "name", "whois", "gopher",
    "remote_job", "netstat", "vmnet", "hostnames", "link", "echo",
    "discard", "daytime", "systat", "sunrpc", "supdup", "csnet_ns",
    "urp_i", "X11", "urh_i", "pm_dump", "ctf", "tftp_u", "courier",
    "exec", "uucp", "kshell", "nntp", "IRC", "nnsp", "http_443",
    "iso_tsap", "shell", "klogin", "sql_net", "printer", "uucp_path",
    "time", "netbios_ssn", "netbios_ns", "netbios_dgm", "ldap", "eco_i",
    "ecr_i", "tim_i", "red_i", "harvest",
}
FLAG_TYPES = {"SF", "S0", "REJ", "RSTO", "RSTOS0", "RSTR", "S1", "S2", "S3", "OTH", "SH"}


class ObserverAgent:
    """Validates and normalises incoming network traffic data."""

    def validate_and_normalise(self, raw: Dict[str, Any]) -> NetworkFeatures:
        """
        Validate raw feature dict, apply defaults for missing optional fields,
        coerce categorical columns to lower-case strings.
        Returns a NetworkFeatures model instance.
        """
        cleaned: Dict[str, Any] = {}

        for field in REQUIRED_FIELDS:
            val = raw.get(field)
            if val is None:
                # Use the Pydantic default
                default = NetworkFeatures.model_fields[field].default
                cleaned[field] = default if default is not None else 0
            else:
                cleaned[field] = val

        # Normalise categoricals
        cleaned["protocol_type"] = str(cleaned.get("protocol_type", "tcp")).lower()
        cleaned["service"]        = str(cleaned.get("service",        "http")).lower()
        cleaned["flag"]           = str(cleaned.get("flag",           "SF")).upper()

        features = NetworkFeatures(**cleaned)
        logger.info("ObserverAgent: features validated OK")
        return features

    def validate_batch(self, rows: List[Dict[str, Any]]) -> List[NetworkFeatures]:
        """Validate a list of feature dicts (file-upload path)."""
        validated = []
        errors    = []
        for idx, row in enumerate(rows):
            try:
                validated.append(self.validate_and_normalise(row))
            except Exception as exc:
                errors.append({"row": idx, "error": str(exc)})
                logger.warning("ObserverAgent: row %d failed – %s", idx, exc)
        if errors:
            logger.warning("ObserverAgent: %d rows failed validation", len(errors))
        return validated


observer_agent = ObserverAgent()
