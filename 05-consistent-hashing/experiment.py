"""Compare key movement: modulo vs ring. Run: python experiment.py"""
from hash_ring import HashRing, h

KEYS = [f"key-{i}" for i in range(200_000)]


def modulo_moved(n_before, n_after):
    return sum(h(k) % n_before != h(k) % n_after for k in KEYS) / len(KEYS)


def ring_moved(n_before, n_after, vnodes=100):
    before = HashRing([f"s{i}" for i in range(n_before)], vnodes)
    after = HashRing([f"s{i}" for i in range(n_after)], vnodes)
    return sum(before.get_node(k) != after.get_node(k) for k in KEYS) / len(KEYS)


if __name__ == "__main__":
    print(f"modulo 10->11: {modulo_moved(10, 11):.1%} keys moved")
    print(f"ring   10->11: {ring_moved(10, 11):.1%} keys moved")
    # TODO: load std-dev vs vnodes, and a plot
