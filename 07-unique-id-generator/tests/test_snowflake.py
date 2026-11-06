import pytest
from snowflake import EPOCH_MS, ClockMovedBackwards, Snowflake, parse


def test_unique_and_increasing():
    g = Snowflake(1, 1)
    ids = [g.next_id() for _ in range(50_000)]
    assert len(set(ids)) == len(ids)
    assert ids == sorted(ids)
    assert all(0 < i < 2**63 for i in ids)


def test_parse_roundtrip():
    t = [EPOCH_MS + 1000]
    g = Snowflake(3, 7, clock=lambda: t[0])
    a = parse(g.next_id())
    b = parse(g.next_id())
    assert a == {"timestamp_ms": EPOCH_MS + 1000, "datacenter": 3, "machine": 7, "sequence": 0}
    assert b["sequence"] == 1


def test_sequence_overflow_waits_for_next_ms():
    source = [lambda: EPOCH_MS + 5]
    g = Snowflake(0, 0, clock=lambda: source[0]())
    ids = [g.next_id() for _ in range(4096)]          # seq 0..4095 all in ms 5
    assert parse(ids[-1]) ["sequence"] == 4095
    ticks = iter([EPOCH_MS + 5] * 3)                   # still ms 5 for a few calls...
    source[0] = lambda: next(ticks, EPOCH_MS + 6)      # ...then ms 6
    nxt = parse(g.next_id())
    assert nxt["timestamp_ms"] == EPOCH_MS + 6
    assert nxt["sequence"] == 0


def test_clock_backwards():
    t = [EPOCH_MS + 100]
    g = Snowflake(0, 0, clock=lambda: t[0])
    g.next_id()
    t[0] -= 10
    with pytest.raises(ClockMovedBackwards):
        g.next_id()


def test_different_machines_differ():
    t = lambda: EPOCH_MS + 1
    assert Snowflake(0, 1, t).next_id() != Snowflake(0, 2, t).next_id()
