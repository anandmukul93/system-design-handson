"""Vector clock: dict of node_id -> counter."""
from __future__ import annotations


class VectorClock:
    def __init__(self, clock: dict[str, int] | None = None):
        self.clock = dict(clock or {})

    def increment(self, node: str) -> "VectorClock":
        """Return a NEW clock with node's counter + 1."""
        raise NotImplementedError

    def merge(self, other: "VectorClock") -> "VectorClock":
        """Element-wise max."""
        raise NotImplementedError

    def descends_from(self, other: "VectorClock") -> bool:
        """True if self >= other on every entry (self happened after or equals other)."""
        raise NotImplementedError

    def conflicts_with(self, other: "VectorClock") -> bool:
        """Neither descends from the other."""
        raise NotImplementedError
