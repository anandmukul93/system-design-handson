import pytest
from releases import BlueGreen, bucket, canary_decision, evaluate, rolling_plan


def test_bucket_stable_and_spread():
    assert bucket("u1", "new-checkout") == bucket("u1", "new-checkout")
    bs = [bucket(f"u{i}", "f") for i in range(10_000)]
    assert all(0 <= b < 100 for b in bs)
    assert 900 < sum(b < 10 for b in bs) < 1100


def test_percentage_rollout_is_monotonic():
    users = [f"u{i}" for i in range(2000)]
    on10 = {u for u in users if evaluate("f", {"enabled": True, "percent": 10}, u)}
    on50 = {u for u in users if evaluate("f", {"enabled": True, "percent": 50}, u)}
    assert on10 <= on50


def test_rules():
    cfg = {"enabled": True, "percent": 0, "allow": ["qa"], "deny": ["vip"]}
    assert evaluate("f", cfg, "qa") and not evaluate("f", cfg, "vip") and not evaluate("f", cfg, "x")
    assert not evaluate("f", {"enabled": False, "percent": 100, "allow": ["qa"]}, "qa")


def test_rolling_plan():
    assert rolling_plan(4, 1, 0) == [(3, 1), (2, 2), (1, 3), (0, 4)]
    assert rolling_plan(4, 2, 1) == [(1, 2), (0, 4)]
    with pytest.raises(ValueError):
        rolling_plan(4, 0, 0)


def test_canary():
    assert canary_decision((10, 10_000), (5, 1000)) == "rollback"
    assert canary_decision((10, 10_000), (1, 1000)) == "promote"
    assert canary_decision((10, 10_000), (0, 50)) == "wait"


def test_blue_green():
    bg = BlueGreen("v1")
    assert bg.deploy("v2") == "green"
    assert bg.serving() == "v1"
    bg.switch()
    assert bg.serving() == "v2"
    bg.rollback()
    assert bg.serving() == "v1"
