from feed import FeedService


def test_fanout_on_write_for_normal_users():
    f = FeedService(celebrity_threshold=10)
    f.follow("bob", "alice"); f.follow("carol", "alice")
    f.publish("alice", "hi", ts=1)
    assert f.fanout_writes == 2
    assert [p["text"] for p in f.get_feed("bob")] == ["hi"]


def test_celebrity_pulled_at_read_time():
    f = FeedService(celebrity_threshold=3)
    for u in ["a", "b", "c", "d"]:
        f.follow(u, "star")
    f.follow("a", "friend")
    f.publish("friend", "from friend", ts=1)
    f.publish("star", "from star", ts=2)
    assert f.fanout_writes == 1  # only friend's post fanned out
    assert [p["text"] for p in f.get_feed("a")] == ["from star", "from friend"]


def test_limit_and_cap():
    f = FeedService(celebrity_threshold=100, feed_cap=5)
    f.follow("u", "w")
    for i in range(10):
        f.publish("w", f"p{i}", ts=i)
    assert len(f.feeds["u"]) == 5
    assert [p["text"] for p in f.get_feed("u", limit=3)] == ["p9", "p8", "p7"]
