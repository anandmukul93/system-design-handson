from tsdb import TSDB, AlertRule, series_key


def test_series_key_sorted():
    assert series_key("cpu", {"region": "us", "host": "a"}) == "cpu{host=a,region=us}"


def test_select_and_range():
    db = TSDB()
    for t in range(10):
        db.append("cpu", {"host": "a", "region": "us"}, t, t * 1.0)
        db.append("cpu", {"host": "b", "region": "eu"}, t, 0.0)
    keys = db.select("cpu", {"region": "us"})
    assert keys == ["cpu{host=a,region=us}"]
    assert db.range(keys[0], 2, 5) == [(2, 2.0), (3, 3.0), (4, 4.0)]


def test_downsample():
    db = TSDB()
    for t in range(10):
        db.append("m", {}, t, float(t))
    k = series_key("m", {})
    assert db.downsample(k, 0, 10, 5, "avg") == [(0, 2.0), (5, 7.0)]
    assert db.downsample(k, 0, 10, 5, "max") == [(0, 4.0), (5, 9.0)]


def test_alert_for_duration():
    rule = AlertRule(threshold=80, for_seconds=60)
    pts = [(t, 90.0) for t in range(0, 120, 10)]
    assert rule.evaluate(pts, now=120)
    pts[-1] = (110, 50.0)
    assert not rule.evaluate(pts, now=120)
    assert not rule.evaluate([], now=120)
