import math

from routing import astar, dijkstra


def grid(n):
    """n x n grid, unit cost, 4-connected. Node = (x, y)."""
    g = {}
    for x in range(n):
        for y in range(n):
            g[(x, y)] = [((x + dx, y + dy), 1.0) for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]
                         if 0 <= x + dx < n and 0 <= y + dy < n]
    return g


def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def test_dijkstra_small():
    g = {"a": [("b", 1), ("c", 4)], "b": [("c", 1), ("d", 5)], "c": [("d", 1)], "d": []}
    cost, path, _ = dijkstra(g, "a", "d")
    assert cost == 3 and path == ["a", "b", "c", "d"]


def test_unreachable():
    cost, path, _ = dijkstra({"a": [], "b": []}, "a", "b")
    assert cost == math.inf and path == []


def test_astar_matches_and_expands_less():
    g = grid(30)
    c1, p1, e1 = dijkstra(g, (5, 15), (25, 15))
    c2, p2, e2 = astar(g, (5, 15), (25, 15), manhattan)
    assert c1 == c2 == 20
    assert p2[0] == (5, 15) and p2[-1] == (25, 15)
    assert e2 < e1
