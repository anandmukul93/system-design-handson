from cache_deep import EdgeCache, LRUCache, fingerprint_url


def test_lru():
    c = LRUCache(2)
    c.put("a", 1); c.put("b", 2)
    assert c.get("a") == 1
    c.put("c", 3)
    assert c.get("b") is None
    assert c.keys() == ["c", "a"]
    c.put("a", 10)
    assert c.keys() == ["a", "c"] and c.get("a") == 10


def test_edge_cache_ttl_swr_and_purge():
    t = [0.0]
    version = [1]
    origin = lambda url: (f"{url} v{version[0]}", 10, 20, ["product:42"])
    edge = EdgeCache(origin, lambda: t[0])
    assert edge.get("/p/42") == ("/p/42 v1", "MISS")
    t[0] = 5
    assert edge.get("/p/42") == ("/p/42 v1", "HIT")
    version[0] = 2
    t[0] = 15
    assert edge.get("/p/42") == ("/p/42 v1", "STALE")   # served stale, refreshed behind
    assert edge.get("/p/42") == ("/p/42 v2", "HIT")
    assert edge.origin_calls == 2
    t[0] = 100
    assert edge.get("/p/42")[1] == "MISS"
    assert edge.purge_tag("product:42") == 1
    assert edge.get("/p/42")[1] == "MISS"


def test_fingerprint():
    u = fingerprint_url("/static/app.js", b"console.log(1)")
    assert u.startswith("/static/app.") and u.endswith(".js") and len(u) == len("/static/app.12345678.js")
    assert u != fingerprint_url("/static/app.js", b"console.log(2)")
