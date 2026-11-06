import random

from leaderboard import Leaderboard


def test_top_and_rank():
    lb = Leaderboard()
    lb.add_points("a", 10); lb.add_points("b", 30); lb.add_points("c", 20)
    lb.add_points("a", 25)  # a = 35
    assert lb.top(3) == [("a", 35), ("b", 30), ("c", 20)]
    assert lb.rank("c") == 3 and lb.rank("zzz") is None


def test_ties_by_user_id():
    lb = Leaderboard()
    for u in ["m", "b", "x"]:
        lb.add_points(u, 5)
    assert [u for u, _ in lb.top(3)] == ["b", "m", "x"]


def test_around():
    lb = Leaderboard()
    for i in range(20):
        lb.add_points(f"u{i:02d}", i)
    assert [u for u, _ in lb.around("u10", k=2)] == ["u12", "u11", "u10", "u09", "u08"]
    assert [u for u, _ in lb.around("u19", k=2)] == ["u19", "u18", "u17"]


def test_matches_sorting_at_scale():
    rng = random.Random(1)
    lb = Leaderboard()
    truth = {}
    for _ in range(5000):
        u, p = f"u{rng.randrange(800)}", rng.randrange(1, 50)
        truth[u] = truth.get(u, 0) + p
        lb.add_points(u, p)
    expected = sorted(truth.items(), key=lambda kv: (-kv[1], kv[0]))
    assert lb.top(50) == expected[:50]
    for u, _ in expected[::37]:
        assert lb.rank(u) == expected.index((u, truth[u])) + 1
