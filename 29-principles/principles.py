"""Theory you can execute."""
import math


def percentile(values: list[float], p: float) -> float:
    """Nearest-rank percentile: sort, rank = ceil(p/100 * n), return the rank-th value (1-based).
    p=0 returns the minimum."""
    raise NotImplementedError


def p_request_hits_slow(p_slow: float, fanout: int) -> float:
    """Probability that at least one of `fanout` independent calls is slow."""
    raise NotImplementedError


def littles_law_concurrency(arrival_rate_per_s: float, latency_s: float) -> float:
    raise NotImplementedError


def quorum_ops(n: int, w: int, r: int, reachable: int) -> dict:
    """{"strong": w + r > n, "can_write": reachable >= w, "can_read": reachable >= r}"""
    raise NotImplementedError


class LamportClock:
    def __init__(self):
        self.time = 0

    def tick(self) -> int:
        """Local event."""
        raise NotImplementedError

    def send(self) -> int:
        """Return the timestamp to attach to an outgoing message."""
        raise NotImplementedError

    def receive(self, msg_time: int) -> int:
        """max(local, msg) + 1"""
        raise NotImplementedError
