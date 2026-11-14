from autoscale import FunctionPool, TargetTrackingScaler, monthly_cost


def test_target_tracking():
    s = TargetTrackingScaler(target=50, min_replicas=2, max_replicas=10, scale_in_cooldown=300)
    assert s.desired(4, 90, now=0) == 8           # 4 * 90/50 = 7.2 -> 8
    assert s.desired(8, 200, now=10) == 10        # clamp
    assert s.desired(10, 10, now=100) == 10       # cooldown blocks scale-in
    assert s.desired(10, 10, now=400) == 2        # 10*10/50 = 2
    assert s.desired(2, 1, now=1000) == 2         # min


def test_cold_starts():
    p = FunctionPool(duration=1, idle_timeout=60)
    assert p.invoke(0) == "cold"
    assert p.invoke(0.5) == "cold"     # first instance still busy
    assert p.invoke(2) == "warm"
    assert p.invoke(200) == "cold"     # everything reclaimed
    assert (p.cold, p.warm) == (3, 1)


def test_monthly_cost():
    low = monthly_cost(1_000_000, 0.125, 0.0000166667, 0.20, 30, 2)
    assert low == {"serverless": 2.28, "vm": 60, "cheaper": "serverless"}
    high = monthly_cost(500_000_000, 0.125, 0.0000166667, 0.20, 30, 2)
    assert high["cheaper"] == "vm"
