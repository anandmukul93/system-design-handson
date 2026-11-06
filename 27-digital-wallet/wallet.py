"""Event-sourced wallet. State is ONLY changed by applying events."""
import json
from dataclasses import dataclass, field


class InsufficientFunds(Exception):
    pass


@dataclass
class Wallet:
    balances: dict = field(default_factory=dict)
    events: list = field(default_factory=list)     # the source of truth
    processed_requests: set = field(default_factory=set)

    # --- commands: validate, then emit events -----------------------
    def deposit(self, request_id: str, account: str, amount: int) -> None:
        raise NotImplementedError

    def transfer(self, request_id: str, src: str, dst: str, amount: int) -> None:
        """Raise InsufficientFunds without emitting anything if src can't cover it.
        Duplicate request_id: do nothing (idempotent)."""
        raise NotImplementedError

    # --- events: pure state transitions -----------------------------
    def apply(self, event: dict) -> None:
        raise NotImplementedError

    # --- replay / snapshots -----------------------------------------
    @classmethod
    def replay(cls, events: list[dict], snapshot: dict | None = None) -> "Wallet":
        """snapshot = {"balances": {...}, "event_count": n, "processed_requests": [...]};
        apply events[n:] on top of it."""
        raise NotImplementedError

    def snapshot(self) -> dict:
        raise NotImplementedError

    def total(self) -> int:
        return sum(self.balances.values())
