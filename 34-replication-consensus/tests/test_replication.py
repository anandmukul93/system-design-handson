from collections import Counter

from replication import RaftNode, ReadYourWritesRouter, hash_partition, majority, range_partition


def test_majority():
    assert [majority(n) for n in (1, 3, 4, 5)] == [1, 2, 3, 3]


def test_vote_once_per_term():
    n = RaftNode("n1")
    assert n.handle_request_vote(1, "a", 0, 0) == (1, True)
    assert n.handle_request_vote(1, "b", 0, 0) == (1, False)
    assert n.handle_request_vote(1, "a", 0, 0) == (1, True)   # same candidate again is fine
    assert n.handle_request_vote(2, "b", 0, 0) == (2, True)   # new term


def test_reject_stale_term_and_stale_log():
    n = RaftNode("n1", log_terms=[1, 1, 2])
    n.current_term = 3
    assert n.handle_request_vote(2, "a", 10, 2) == (3, False)
    assert n.handle_request_vote(4, "a", 5, 1) == (4, False)   # older last term
    assert n.handle_request_vote(4, "b", 2, 2) == (4, False)   # same term, shorter log
    assert n.handle_request_vote(4, "c", 3, 2) == (4, True)


def test_partitioners():
    counts = Counter(hash_partition(f"user{i}", 4) for i in range(4000))
    assert set(counts) == {0, 1, 2, 3} and min(counts.values()) > 800
    b = ["g", "n", "t"]
    assert [range_partition(k, b) for k in ["apple", "grape", "mango", "zebra"]] == [0, 1, 1, 3]


def test_read_your_writes():
    r = ReadYourWritesRouter(window_s=5)
    assert r.route_read("u", 0) == "replica"
    r.record_write("u", 10)
    assert r.route_read("u", 12) == "primary"
    assert r.route_read("other", 12) == "replica"
    assert r.route_read("u", 16) == "replica"
