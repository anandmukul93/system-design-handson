from datetime import datetime

from async_jobs import EventBus, WorkQueue, cron_matches, next_run, parse_field


def test_parse_field():
    assert parse_field("*/15", 0, 59) == {0, 15, 30, 45}
    assert parse_field("1-5", 0, 6) == {1, 2, 3, 4, 5}
    assert parse_field("1,3,10-12", 0, 59) == {1, 3, 10, 11, 12}
    assert parse_field("0-10/5", 0, 59) == {0, 5, 10}


def test_next_run():
    assert next_run("*/15 * * * *", datetime(2026, 11, 14, 10, 7)) == datetime(2026, 11, 14, 10, 15)
    # 2026-11-13 is a Friday: next weekday 09:00 is Monday the 16th
    assert next_run("0 9 * * 1-5", datetime(2026, 11, 13, 10, 0)) == datetime(2026, 11, 16, 9, 0)
    assert next_run("30 2 1 * *", datetime(2026, 11, 14)) == datetime(2026, 12, 1, 2, 30)
    assert cron_matches("0 0 * * 0", datetime(2026, 11, 15, 0, 0))   # Sunday midnight


def test_visibility_timeout_and_dlq():
    q = WorkQueue(visibility_timeout=10, max_receives=2)
    a = q.send("job-a")
    m = q.receive(now=0)
    assert m["id"] == a and m["receives"] == 1
    assert q.receive(now=5) is None          # still invisible
    m = q.receive(now=11)                    # worker crashed: it reappears
    assert m["receives"] == 2
    assert q.receive(now=22) is None          # third time: moved to DLQ
    assert [d["body"] for d in q.dlq] == ["job-a"]


def test_delete_acks():
    q = WorkQueue(visibility_timeout=10)
    q.send("x")
    q.delete(q.receive(0)["id"])
    assert q.receive(100) is None


def test_event_bus():
    bus = EventBus()
    got = []
    bus.subscribe("order.placed", lambda e: got.append(("email", e)))
    bus.subscribe("order.placed", lambda e: 1 / 0)
    bus.subscribe("order.placed", lambda e: got.append(("stock", e)))
    assert bus.publish("order.placed", {"id": 1}) == 2
    assert [g[0] for g in got] == ["email", "stock"]
    assert len(bus.failures) == 1
    assert bus.publish("nobody.listens", {}) == 0
