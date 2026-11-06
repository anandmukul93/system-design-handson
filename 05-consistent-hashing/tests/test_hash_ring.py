from collections import Counter

from hash_ring import HashRing

KEYS = [f"k{i}" for i in range(20_000)]


def test_deterministic_and_member():
    r = HashRing(["a", "b", "c"])
    assert r.get_node("x") == r.get_node("x")
    assert r.get_node("x") in {"a", "b", "c"}


def test_balance_with_vnodes():
    r = HashRing([f"s{i}" for i in range(5)], vnodes=200)
    counts = Counter(r.get_node(k) for k in KEYS)
    assert max(counts.values()) / min(counts.values()) < 1.5


def test_adding_node_moves_about_one_over_n():
    r = HashRing([f"s{i}" for i in range(4)], vnodes=100)
    before = {k: r.get_node(k) for k in KEYS}
    r.add_node("s4")
    moved = [k for k in KEYS if r.get_node(k) != before[k]]
    assert 0.10 < len(moved) / len(KEYS) < 0.30
    assert all(r.get_node(k) == "s4" for k in moved)  # keys only move TO the new node


def test_remove_node():
    r = HashRing(["a", "b", "c"])
    r.remove_node("b")
    assert all(r.get_node(k) != "b" for k in KEYS[:2000])


def test_get_nodes_distinct():
    r = HashRing(["a", "b", "c", "d"], vnodes=50)
    nodes = r.get_nodes("hello", 3)
    assert len(nodes) == 3 and len(set(nodes)) == 3
    assert nodes[0] == r.get_node("hello")
