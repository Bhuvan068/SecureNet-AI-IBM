"""
File parser — Extracts network feature rows from CSV, Excel,
JSON, TXT, LOG, and PDF uploads.
"""
from __future__ import annotations

import csv
import io
import json
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Default network features with zero/empty values
_DEFAULTS: Dict[str, Any] = {
    "duration": 0.0,
    "protocol_type": "tcp",
    "service": "http",
    "flag": "SF",
    "src_bytes": 0.0,
    "dst_bytes": 0.0,
    "land": 0,
    "wrong_fragment": 0,
    "urgent": 0,
    "hot": 0,
    "num_failed_logins": 0,
    "logged_in": 0,
    "num_compromised": 0,
    "root_shell": 0,
    "su_attempted": 0,
    "num_root": 0,
    "num_file_creations": 0,
    "num_shells": 0,
    "num_access_files": 0,
    "num_outbound_cmds": 0,
    "is_host_login": 0,
    "is_guest_login": 0,
    "count": 0.0,
    "srv_count": 0.0,
    "serror_rate": 0.0,
    "srv_serror_rate": 0.0,
    "rerror_rate": 0.0,
    "srv_rerror_rate": 0.0,
    "same_srv_rate": 0.0,
    "diff_srv_rate": 0.0,
    "srv_diff_host_rate": 0.0,
    "dst_host_count": 0.0,
    "dst_host_srv_count": 0.0,
    "dst_host_same_srv_rate": 0.0,
    "dst_host_diff_srv_rate": 0.0,
    "dst_host_same_src_port_rate": 0.0,
    "dst_host_srv_diff_host_rate": 0.0,
    "dst_host_serror_rate": 0.0,
    "dst_host_srv_serror_rate": 0.0,
    "dst_host_rerror_rate": 0.0,
    "dst_host_srv_rerror_rate": 0.0,
}

_KNOWN_FIELDS = set(_DEFAULTS.keys())


def _coerce_row(row: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(_DEFAULTS)
    for k, v in row.items():
        key = k.strip().lower().replace(" ", "_").replace("-", "_")
        if key in _KNOWN_FIELDS:
            try:
                out[key] = float(v) if key not in ("protocol_type", "service", "flag") else str(v)
            except (ValueError, TypeError):
                out[key] = _DEFAULTS.get(key, 0)
    return out


# ─── Parsers ─────────────────────────────────────────────────────────────────

def parse_csv(content: bytes) -> List[Dict[str, Any]]:
    text   = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    return [_coerce_row(row) for row in reader]


def parse_json(content: bytes) -> List[Dict[str, Any]]:
    data = json.loads(content.decode("utf-8", errors="replace"))
    if isinstance(data, dict):
        data = [data]
    return [_coerce_row(row) for row in data]


def parse_excel(content: bytes) -> List[Dict[str, Any]]:
    try:
        import pandas as pd
        df  = pd.read_excel(io.BytesIO(content))
        return [_coerce_row(row) for row in df.to_dict(orient="records")]
    except ImportError:
        logger.error("pandas / openpyxl not installed – cannot parse Excel")
        return []


def parse_txt_log(content: bytes) -> List[Dict[str, Any]]:
    """
    Attempt to parse comma/tab/space-delimited text or log files.
    If the first line looks like headers, use it. Otherwise assume
    KDD-99 positional format.
    """
    text  = content.decode("utf-8", errors="replace")
    lines = [l.strip() for l in text.splitlines() if l.strip() and not l.startswith("#")]

    if not lines:
        return []

    # Detect delimiter
    first = lines[0]
    delim = "," if first.count(",") > first.count("\t") else "\t"
    parts = [p.strip() for p in re.split(r"[,\t ]+", first)]

    # KDD-99 positional field names
    kdd99_fields = list(_DEFAULTS.keys())

    rows = []
    if len(parts) == len(kdd99_fields):
        # Headerless positional
        for line in lines:
            vals = [p.strip().rstrip(".") for p in re.split(r"[,\t ]+", line)]
            if len(vals) >= len(kdd99_fields):
                row = dict(zip(kdd99_fields, vals[: len(kdd99_fields)]))
                rows.append(_coerce_row(row))
    else:
        # Treat first line as header
        headers = parts
        for line in lines[1:]:
            vals = [p.strip().rstrip(".") for p in re.split(r"[,\t ]+", line)]
            row  = dict(zip(headers, vals))
            rows.append(_coerce_row(row))

    return rows


def parse_pdf(content: bytes) -> List[Dict[str, Any]]:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text   = "\n".join(page.extract_text() or "" for page in reader.pages)
        return parse_txt_log(text.encode())
    except Exception as exc:
        logger.error("PDF parse failed – %s", exc)
        return []


def parse_file(filename: str, content: bytes) -> List[Dict[str, Any]]:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    logger.info("Parsing file: %s  ext=%s  size=%d", filename, ext, len(content))

    dispatch = {
        "csv":  parse_csv,
        "json": parse_json,
        "xlsx": parse_excel,
        "xls":  parse_excel,
        "txt":  parse_txt_log,
        "log":  parse_txt_log,
        "pdf":  parse_pdf,
    }

    parser = dispatch.get(ext, parse_txt_log)
    rows   = parser(content)
    logger.info("Parsed %d rows from %s", len(rows), filename)
    return rows
