"""Tumbling-window aggregator with watermark.

window_start(ts) = ts - ts % window. The watermark is max_event_ts_seen - allowed_lateness.
A window [s, s+window) closes when watermark >= s + window; closed windows are emitted once.
Events for already-closed windows go to self.late (not counted)."""
from collections import Counter, defaultdict


class WindowAggregator:
    def __init__(self, window: int = 60, allowed_lateness: int = 15, top_n: int = 3):
        self.window, self.allowed_lateness, self.top_n = window, allowed_lateness, top_n
        self.open: dict[int, Counter] = defaultdict(Counter)
        self.seen: dict[int, set] = defaultdict(set)
        self.closed: set[int] = set()
        self.late: list[dict] = []
        self.max_ts = None

    def add(self, event: dict) -> list[dict]:
        """event = {"click_id", "ad_id", "ts"}. Dedupe by click_id per window.
        Return list of newly closed windows as
        {"window_start": s, "counts": {ad_id: n}, "top": [ad_id, ...]} (top: count desc, then ad_id)."""
        raise NotImplementedError
