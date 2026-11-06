"""Cache-aside (lazy loading) helper.

read path:  look in cache -> on miss, load from DB -> write into cache with TTL
write path: write DB -> invalidate (delete) the cache key
"""
import time
from typing import Any, Callable, Optional


class InMemoryCache:
    """Tiny stand-in for Redis so the logic can be tested without docker."""

    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self._data: dict[str, tuple[Any, float]] = {}
        self._clock = clock

    def get(self, key: str) -> Optional[Any]:
        item = self._data.get(key)
        if item is None:
            return None
        value, expires_at = item
        if self._clock() >= expires_at:
            del self._data[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: float) -> None:
        self._data[key] = (value, self._clock() + ttl)

    def delete(self, key: str) -> None:
        self._data.pop(key, None)


class CacheAside:
    def __init__(self, cache, ttl: float = 60.0):
        self.cache = cache
        self.ttl = ttl
        self.hits = 0
        self.misses = 0

    def get(self, key: str, loader: Callable[[], Any]) -> Any:
        """Return cached value, or call loader(), cache the result and return it.
        Update self.hits / self.misses. Do NOT cache a None result."""
        raise NotImplementedError

    def invalidate(self, key: str) -> None:
        """Call after a write to the source of truth."""
        raise NotImplementedError
