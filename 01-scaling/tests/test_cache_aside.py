from cache_aside import CacheAside, InMemoryCache


class Clock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def test_miss_then_hit():
    calls = []
    c = CacheAside(InMemoryCache(), ttl=10)
    loader = lambda: calls.append(1) or {"id": 1}
    assert c.get("u:1", loader) == {"id": 1}
    assert c.get("u:1", loader) == {"id": 1}
    assert len(calls) == 1
    assert (c.hits, c.misses) == (1, 1)


def test_ttl_expiry_reloads():
    clock = Clock()
    c = CacheAside(InMemoryCache(clock), ttl=10)
    calls = []
    loader = lambda: calls.append(1) or "v"
    c.get("k", loader)
    clock.t = 11
    c.get("k", loader)
    assert len(calls) == 2


def test_invalidate_forces_reload():
    c = CacheAside(InMemoryCache(), ttl=10)
    value = {"name": "old"}
    c.get("k", lambda: dict(value))
    value["name"] = "new"
    c.invalidate("k")
    assert c.get("k", lambda: dict(value)) == {"name": "new"}


def test_none_not_cached():
    c = CacheAside(InMemoryCache(), ttl=10)
    calls = []
    c.get("missing", lambda: calls.append(1))
    c.get("missing", lambda: calls.append(1))
    assert len(calls) == 2
