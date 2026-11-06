"""Leaderboard on top of your own skip list.

Order: higher score first; ties broken by user_id ascending. Ranks are 1-based."""
import random

MAX_LEVEL = 16


class _Node:
    __slots__ = ("key", "user", "forward", "span")

    def __init__(self, key, user, level):
        self.key, self.user = key, user
        self.forward = [None] * level
        self.span = [0] * level     # how many nodes each forward pointer skips (for O(log n) rank)


class SkipList:
    """Sorted by key ascending. Implement span bookkeeping for rank()."""

    def __init__(self, seed: int = 0):
        self.rng = random.Random(seed)
        self.head = _Node(None, None, MAX_LEVEL)
        self.level = 1
        self.length = 0

    def insert(self, key, user) -> None:
        raise NotImplementedError

    def delete(self, key, user) -> None:
        raise NotImplementedError

    def rank(self, key, user) -> int:
        """0-based position."""
        raise NotImplementedError

    def by_rank(self, start: int, stop: int) -> list:
        """users at positions [start, stop)."""
        raise NotImplementedError


class Leaderboard:
    def __init__(self):
        self.scores: dict[str, int] = {}
        self.sl = SkipList()

    def add_points(self, user: str, points: int) -> int:
        """Like ZINCRBY. Return new score."""
        raise NotImplementedError

    def top(self, n: int = 10) -> list[tuple[str, int]]:
        raise NotImplementedError

    def rank(self, user: str) -> int | None:
        """1-based, None if unknown."""
        raise NotImplementedError

    def around(self, user: str, k: int = 4) -> list[tuple[str, int]]:
        """Up to k above and k below the user, including the user."""
        raise NotImplementedError
