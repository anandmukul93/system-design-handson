"""URL frontier = prioritizer (front queues) + politeness router (back queues).

next_url(now) must never return two URLs for the same host less than
`delay` seconds apart. Higher priority (lower number) URLs come first when
several hosts are ready."""
from urllib.parse import urlsplit, urlunsplit


def normalize(url: str) -> str:
    """Lowercase scheme+host, drop fragment, drop default ports (:80 for http,
    :443 for https), empty path -> '/'."""
    raise NotImplementedError


class Frontier:
    def __init__(self, delay: float = 1.0):
        self.delay = delay

    def add(self, url: str, priority: int = 5) -> bool:
        """Normalize, skip if seen before. Return True if enqueued."""
        raise NotImplementedError

    def next_url(self, now: float) -> str | None:
        """Return a URL whose host is allowed to be fetched at `now`, or None."""
        raise NotImplementedError

    def __len__(self) -> int:
        raise NotImplementedError
