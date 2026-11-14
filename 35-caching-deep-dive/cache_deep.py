import hashlib


class LRUCache:
    """O(1) get/put. Implement with a dict + your own doubly linked list (no OrderedDict) for practice."""

    def __init__(self, capacity: int):
        self.capacity = capacity

    def get(self, key):
        """Return value or None; marks key most recently used."""
        raise NotImplementedError

    def put(self, key, value) -> None:
        """Insert/update; evict least recently used when over capacity."""
        raise NotImplementedError

    def keys(self) -> list:
        """Most recent first."""
        raise NotImplementedError


class EdgeCache:
    """origin(url) -> (body, ttl, swr, tags).
    get(url) returns (body, status):
      MISS  - not cached or older than ttl + swr: fetch from origin and cache
      HIT   - age < ttl
      STALE - ttl <= age < ttl + swr: return the cached body, then refresh from origin
              (synchronously here; a real CDN does it in the background)
    purge_tag(tag) drops every entry carrying that tag."""

    def __init__(self, origin, clock):
        self.origin, self.clock = origin, clock
        self.origin_calls = 0

    def get(self, url: str) -> tuple[str, str]:
        raise NotImplementedError

    def purge_tag(self, tag: str) -> int:
        """Return number of entries purged."""
        raise NotImplementedError


def fingerprint_url(path: str, content: bytes) -> str:
    """'/static/app.js' + content -> '/static/app.<first 8 hex of sha256>.js'"""
    raise NotImplementedError
