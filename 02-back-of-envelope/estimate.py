"""Estimation helpers. Keep units explicit in names: *_bytes, *_per_sec."""
SECONDS_PER_DAY = 24 * 3600
KB, MB, GB, TB, PB = 10**3, 10**6, 10**9, 10**12, 10**15


def qps(dau: int, actions_per_user_per_day: float) -> float:
    """Average queries per second."""
    raise NotImplementedError


def peak_qps(avg_qps: float, peak_factor: float = 2.0) -> float:
    raise NotImplementedError


def storage_bytes(items_per_day: float, bytes_per_item: float, years: float) -> float:
    """Total bytes stored after `years` (use 365 days/year)."""
    raise NotImplementedError


def servers_needed(peak: float, qps_per_server: float) -> int:
    """Round up."""
    raise NotImplementedError


def downtime_per_year_seconds(availability_pct: float) -> float:
    """e.g. 99.9 -> ~31_536 seconds (8.76 hours)."""
    raise NotImplementedError


def human_bytes(n: float) -> str:
    """1_500_000_000 -> '1.5 GB' (decimal units, one decimal place)."""
    raise NotImplementedError
