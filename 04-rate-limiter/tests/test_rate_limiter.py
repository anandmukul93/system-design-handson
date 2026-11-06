import pytest
from rate_limiter import (FixedWindow, LeakingBucket, SlidingWindowCounter,
                          SlidingWindowLog, TokenBucket)


class Clock:
    def __init__(self, t=0.0):
        self.t = t

    def __call__(self):
        return self.t


def test_token_bucket_burst_then_refill():
    c = Clock()
    tb = TokenBucket(capacity=4, refill_rate=1, clock=c)
    assert [tb.allow("u") for _ in range(5)] == [True] * 4 + [False]
    c.t = 2
    assert [tb.allow("u") for _ in range(3)] == [True, True, False]


def test_token_bucket_keys_independent():
    tb = TokenBucket(capacity=1, refill_rate=1, clock=Clock())
    assert tb.allow("a") and tb.allow("b")
    assert not tb.allow("a")


def test_leaking_bucket():
    c = Clock()
    lb = LeakingBucket(capacity=2, leak_rate=1, clock=c)
    assert [lb.allow("u") for _ in range(3)] == [True, True, False]
    c.t = 1.0
    assert lb.allow("u")


@pytest.mark.parametrize("cls", [FixedWindow, SlidingWindowLog, SlidingWindowCounter])
def test_window_limit(cls):
    c = Clock()
    rl = cls(limit=3, window=60, clock=c)
    assert [rl.allow("u") for _ in range(4)] == [True, True, True, False]
    c.t = 200
    assert rl.allow("u")


def test_fixed_window_edge_burst():
    """Fixed window lets 2x limit through around a boundary - that is the known flaw."""
    c = Clock(59)
    rl = FixedWindow(limit=3, window=60, clock=c)
    first = sum(rl.allow("u") for _ in range(3))
    c.t = 60
    second = sum(rl.allow("u") for _ in range(3))
    assert first + second == 6


def test_sliding_log_no_edge_burst():
    c = Clock(59)
    rl = SlidingWindowLog(limit=3, window=60, clock=c)
    first = sum(rl.allow("u") for _ in range(3))
    c.t = 60
    second = sum(rl.allow("u") for _ in range(3))
    assert first + second == 3


def test_sliding_counter_weighted():
    c = Clock(0)
    rl = SlidingWindowCounter(limit=10, window=60, clock=c)
    for _ in range(10):
        assert rl.allow("u")
    c.t = 90  # 30s into next window: estimate = 0 + 10 * 0.5 = 5 -> 5 more allowed
    allowed = sum(rl.allow("u") for _ in range(10))
    assert allowed == 5
