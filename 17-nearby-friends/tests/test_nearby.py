from nearby import LocationCache, NearbyFilter


def test_cache_ttl():
    c = LocationCache(ttl=10)
    c.put("a", 1.0, 2.0, ts=0)
    assert c.get("a", now=5) == (1.0, 2.0, 0)
    assert c.get("a", now=11) is None


def test_nearby_filter():
    f = NearbyFilter("me", radius_miles=5)
    f.update_me(37.7749, -122.4194)                       # SF
    near = f.on_friend_update("bob", 37.7849, -122.4094)  # ~1.4 km away
    assert near and near["friend"] == "bob" and 1000 < near["distance_m"] < 2000
    assert f.on_friend_update("la", 34.0522, -118.2437) is None


def test_no_position_yet():
    assert NearbyFilter("me").on_friend_update("x", 0, 0) is None
