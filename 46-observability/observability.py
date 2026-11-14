import json
import re
import time


def parse_traceparent(header: str) -> dict | None:
    """'00-<32 hex trace id>-<16 hex span id>-<2 hex flags>' -> {"version", "trace_id", "span_id", "sampled"}.
    Return None if malformed or if trace/span id is all zeros."""
    raise NotImplementedError


def child_traceparent(parent: str, new_span_id: str) -> str:
    """Same trace id and flags, new span id."""
    raise NotImplementedError


def json_log(level: str, msg: str, clock=time.time, **fields) -> str:
    """One JSON object with keys ts, level, msg plus fields, keys sorted. Redact any field named
    password/token/secret as '***'."""
    raise NotImplementedError


def error_budget(slo_pct: float, total: int, bad: int) -> dict:
    """{"allowed_bad": round(total * (100 - slo) / 100), "remaining": allowed - bad, "consumed_pct": rounded to 1 dp}"""
    raise NotImplementedError


def burn_rate(bad: int, total: int, slo_pct: float) -> float:
    """(bad/total) / (1 - slo/100); 0 when total == 0."""
    raise NotImplementedError


def should_page(short_window: tuple[int, int], long_window: tuple[int, int], slo_pct: float, threshold: float = 14.4) -> bool:
    """Page only when BOTH windows (bad, total) burn faster than threshold."""
    raise NotImplementedError
