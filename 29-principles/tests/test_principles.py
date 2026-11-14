import pytest
from principles import LamportClock, littles_law_concurrency, p_request_hits_slow, percentile, quorum_ops


def test_percentile_nearest_rank():
    v = list(range(1, 101))
    assert percentile(v, 50) == 50
    assert percentile(v, 99) == 99
    assert percentile(v, 100) == 100
    assert percentile([5, 1, 3], 0) == 1


def test_tail_at_scale():
    assert p_request_hits_slow(0.01, 1) == pytest.approx(0.01)
    assert p_request_hits_slow(0.01, 100) == pytest.approx(0.634, abs=1e-3)


def test_littles_law():
    assert littles_law_concurrency(1000, 0.2) == pytest.approx(200)


def test_quorum_partition():
    assert quorum_ops(5, 3, 3, reachable=3) == {"strong": True, "can_write": True, "can_read": True}
    assert quorum_ops(5, 3, 3, reachable=2) == {"strong": True, "can_write": False, "can_read": False}
    assert quorum_ops(3, 1, 1, reachable=1)["strong"] is False


def test_lamport():
    a, b = LamportClock(), LamportClock()
    a.tick(); a.tick()
    t = a.send()          # 3
    assert t == 3
    assert b.receive(t) == 4
    b.tick()
    assert b.receive(1) == 6
