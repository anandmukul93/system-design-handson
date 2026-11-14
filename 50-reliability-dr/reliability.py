from datetime import date


def gfs_retention(backups: list[date], daily: int = 7, weekly: int = 4, monthly: int = 6) -> set[date]:
    """Keep the newest `daily` backups; the newest backup of each of the newest `weekly` ISO weeks;
    and the newest backup of each of the newest `monthly` months. Return the kept set."""
    raise NotImplementedError


class FailureDetector:
    def __init__(self, interval: float, threshold: int):
        self.interval, self.threshold = interval, threshold
        self.last: dict[str, float] = {}

    def heartbeat(self, node: str, now: float) -> None:
        raise NotImplementedError

    def suspects(self, now: float) -> list[str]:
        """Nodes whose last heartbeat is at least threshold * interval old. Sorted."""
        raise NotImplementedError


def failover_target(replicas: list[dict], prefer_region: str | None = None) -> str | None:
    """replicas: [{"id", "healthy", "lsn", "region"}]. Highest lsn among healthy; ties -> prefer_region,
    then lowest id. None if no healthy replica."""
    raise NotImplementedError


def route_region(client: str, latency_ms: dict[str, dict[str, float]], healthy: set[str]) -> str | None:
    """Lowest-latency healthy region for the client."""
    raise NotImplementedError


def run_chaos(requests: int, fault, steady_state_min_success: float, rng) -> dict:
    """fault(rng) -> True if a request succeeded. Return {"success_rate": rounded to 3 dp,
    "hypothesis_held": success_rate >= steady_state_min_success, "aborted": success_rate < 0.5}."""
    raise NotImplementedError
