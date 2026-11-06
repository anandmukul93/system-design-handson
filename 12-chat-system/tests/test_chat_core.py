from chat_core import MessageStore, Presence


def test_per_channel_ids_and_sync():
    s = MessageStore()
    assert s.append("c1", "a", "hi") == 1
    assert s.append("c1", "b", "yo") == 2
    assert s.append("c2", "a", "other") == 1
    assert [m["text"] for m in s.since("c1", 1)] == ["yo"]
    assert s.since("c1", 2) == []


def test_presence_timeout():
    p = Presence(timeout=30)
    p.heartbeat("a", now=0)
    assert p.is_online("a", now=29)
    assert not p.is_online("a", now=31)
    assert not p.is_online("ghost", now=0)


def test_online_among():
    p = Presence(timeout=10)
    p.heartbeat("a", 0); p.heartbeat("b", 5)
    assert p.online_among(["a", "b", "c"], now=12) == ["b"]
