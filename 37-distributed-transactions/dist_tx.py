import hashlib
import json


class TwoPhaseCommit:
    """participants expose prepare() -> bool (may raise), commit(), abort()."""

    def run(self, participants: list) -> str:
        """Phase 1: prepare all (stop at the first 'no' or exception). Phase 2: commit all if every vote
        was yes, else abort every participant. Return 'committed' or 'aborted'."""
        raise NotImplementedError


class Saga:
    def __init__(self):
        self.steps: list[tuple[str, callable, callable]] = []

    def step(self, name: str, action, compensation) -> "Saga":
        self.steps.append((name, action, compensation))
        return self

    def run(self) -> dict:
        """Run actions in order. On an exception, run compensations of COMPLETED steps in reverse.
        Return {"status": "ok"} or {"status": "compensated", "failed": name, "compensated": [names...]}."""
        raise NotImplementedError


class Outbox:
    def __init__(self):
        self.orders: dict[int, dict] = {}
        self.outbox: list[dict] = []   # {"seq", "event", "sent"}

    def place_order(self, order_id: int, data: dict) -> None:
        """Write the order AND an {"type": "OrderPlaced", "order_id"} event in one step (one 'transaction')."""
        raise NotImplementedError

    def relay(self, publish) -> int:
        """Publish unsent events in seq order; mark each sent only after publish returns.
        Stop at the first exception (leave the rest unsent). Return number published."""
        raise NotImplementedError


class IdempotencyConflict(Exception):
    pass


class IdempotencyStore:
    def __init__(self):
        self.results: dict[str, tuple[str, object]] = {}   # key -> (request hash, result)

    def execute(self, key: str, request: dict, fn):
        """Same key + same request: return the stored result without calling fn.
        Same key + different request: raise IdempotencyConflict."""
        raise NotImplementedError
