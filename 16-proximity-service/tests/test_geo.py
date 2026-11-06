import pytest
from geo import decode, encode, haversine_m, neighbors, precision_for_radius


def test_known_geohash():
    assert encode(42.605, -5.603, 5) == "ezs42"
    lat, lon = decode("ezs42")
    assert lat == pytest.approx(42.605, abs=0.03) and lon == pytest.approx(-5.603, abs=0.03)


def test_prefix_locality():
    a = encode(37.7749, -122.4194, 7)
    b = encode(37.7750, -122.4195, 7)
    assert a[:6] == b[:6]


def test_haversine_sf_to_la():
    d = haversine_m(37.7749, -122.4194, 34.0522, -118.2437)
    assert d == pytest.approx(559_000, rel=0.01)


def test_neighbors():
    n = neighbors("ezs42")
    assert len(n) == 8 and len(set(n)) == 8 and "ezs42" not in n
    assert all(len(x) == 5 for x in n)


def test_precision_for_radius():
    assert precision_for_radius(500) == 6
    assert precision_for_radius(1000) == 5
    assert precision_for_radius(20_000) == 4
