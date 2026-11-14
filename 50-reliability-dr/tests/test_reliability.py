import random
from datetime import date, timedelta

from reliability import FailureDetector, failover_target, gfs_retention, route_region, run_chaos


def test_gfs():
    days = [date(2026, 1, 1) + timedelta(days=i) for i in range(120)]   # Jan 1 .. Apr 30
    kept = gfs_retention(days, daily=7, weekly=4, monthly=3)
    assert set(days[-7:]) <= kept
    assert date(2026, 3, 31) in kept and date(2026, 2, 28) in kept   # newest of Mar and Feb
    assert date(2026, 1, 31) not in kept                             # only 3 months kept
    assert len(kept) < 20


def test_failure_detector():
    fd = FailureDetector(interval=1, threshold=3)
    fd.heartbeat("a", 0); fd.heartbeat("b", 0)
    fd.heartbeat("b", 2.5)
    assert fd.suspects(2.9) == []
    assert fd.suspects(3.0) == ["a"]


def test_failover_target():
    reps = [{"id": "r1", "healthy": True, "lsn": 100, "region": "us"},
            {"id": "r2", "healthy": True, "lsn": 120, "region": "eu"},
            {"id": "r3", "healthy": False, "lsn": 130, "region": "us"},
            {"id": "r4", "healthy": True, "lsn": 120, "region": "us"}]
    assert failover_target(reps) == "r2"
    assert failover_target(reps, prefer_region="us") == "r4"
    assert failover_target([{"id": "x", "healthy": False, "lsn": 1, "region": "us"}]) is None


def test_route_region():
    lat = {"mumbai": {"ap-south": 10, "eu-west": 120, "us-east": 200}}
    assert route_region("mumbai", lat, {"ap-south", "eu-west", "us-east"}) == "ap-south"
    assert route_region("mumbai", lat, {"eu-west", "us-east"}) == "eu-west"
    assert route_region("mumbai", lat, set()) is None


def test_chaos():
    r = run_chaos(1000, lambda rng: rng.random() > 0.02, 0.95, random.Random(1))
    assert r["hypothesis_held"] and not r["aborted"] and 0.96 < r["success_rate"] < 1
    r = run_chaos(1000, lambda rng: rng.random() > 0.7, 0.95, random.Random(1))
    assert not r["hypothesis_held"] and r["aborted"]
