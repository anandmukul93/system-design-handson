"""In-memory TSDB core."""
from collections import defaultdict


def series_key(name: str, labels: dict[str, str]) -> str:
    """'cpu{host=a,region=us}' with labels sorted by key."""
    raise NotImplementedError


class TSDB:
    def __init__(self):
        self.series: dict[str, list[tuple[float, float]]] = defaultdict(list)  # key -> [(ts, value)] sorted
        self.labels: dict[str, tuple[str, dict]] = {}

    def append(self, name: str, labels: dict, ts: float, value: float) -> None:
        raise NotImplementedError

    def select(self, name: str, matchers: dict) -> list[str]:
        """Series keys with this name whose labels include all matcher pairs."""
        raise NotImplementedError

    def range(self, key: str, start: float, end: float) -> list[tuple[float, float]]:
        """Points with start <= ts < end."""
        raise NotImplementedError

    def downsample(self, key: str, start: float, end: float, step: float, agg: str = "avg"):
        """Bucket points into [start + i*step, start + (i+1)*step); return [(bucket_start, agg_value)]
        for non-empty buckets. agg in {avg, max, min, sum, count}."""
        raise NotImplementedError


class AlertRule:
    """Fires when every point in the last `for_seconds` window is > threshold (and the window has data)."""

    def __init__(self, threshold: float, for_seconds: float):
        self.threshold, self.for_seconds = threshold, for_seconds

    def evaluate(self, points: list[tuple[float, float]], now: float) -> bool:
        raise NotImplementedError
