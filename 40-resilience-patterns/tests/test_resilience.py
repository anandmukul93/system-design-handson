import random

import pytest
from resilience import BoundedBuffer, CircuitBreaker, CircuitOpen, Deadline, DeadlineExceeded, full_jitter_backoff, retry


class Clock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def fail():
    raise ConnectionError


def test_breaker_lifecycle():
    c = Clock()
    cb = CircuitBreaker(failure_threshold=3, reset_timeout=10, clock=c)
    for _ in range(3):
        with pytest.raises(ConnectionError):
            cb.call(fail)
    assert cb.state == "open"
    calls = []
    with pytest.raises(CircuitOpen):
        cb.call(lambda: calls.append(1))
    assert calls == []
    c.t = 11
    assert cb.state == "half_open"
    with pytest.raises(ConnectionError):
        cb.call(fail)
    assert cb.state == "open"
    c.t = 22
    assert cb.call(lambda: "ok") == "ok"
    assert cb.state == "closed"


def test_success_resets_failures():
    cb = CircuitBreaker(failure_threshold=2, clock=Clock())
    with pytest.raises(ConnectionError):
        cb.call(fail)
    cb.call(lambda: 1)
    with pytest.raises(ConnectionError):
        cb.call(fail)
    assert cb.state == "closed"


def test_full_jitter_bounds():
    rng = random.Random(1)
    vals = [full_jitter_backoff(a, 0.1, 5, rng) for a in range(10) for _ in range(50)]
    assert all(0 <= v <= 5 for v in vals)
    assert max(full_jitter_backoff(2, 0.1, 5, rng) for _ in range(200)) <= 0.4


def test_retry():
    sleeps, n = [], [0]
    def flaky():
        n[0] += 1
        if n[0] < 3:
            raise TimeoutError
        return "done"
    assert retry(flaky, 5, 0.1, 1, sleeps.append, random.Random(0)) == "done"
    assert len(sleeps) == 2
    with pytest.raises(TimeoutError):
        retry(lambda: (_ for _ in ()).throw(TimeoutError()), 3, 0.1, 1, sleeps.append, random.Random(0))
    with pytest.raises(ValueError):
        retry(lambda: (_ for _ in ()).throw(ValueError()), 3, 0.1, 1, sleeps.append, random.Random(0), retry_on=(TimeoutError,))


def test_deadline():
    c = Clock()
    d = Deadline(1.0, clock=c)
    c.t = 0.4
    assert d.remaining() == pytest.approx(0.6)
    assert d.child(5).remaining() == pytest.approx(0.6)
    assert d.child(0.1).remaining() == pytest.approx(0.1)
    c.t = 2
    assert d.remaining() == 0
    with pytest.raises(DeadlineExceeded):
        d.check()


def test_bounded_buffer():
    b = BoundedBuffer(2)
    assert b.offer(1) and b.offer(2) and not b.offer(3)
    d = BoundedBuffer(2, "drop_oldest")
    for i in range(4):
        assert d.offer(i)
    assert list(d.items) == [2, 3] and d.dropped == 2
