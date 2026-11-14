import hashlib
import math


def bucket(user_id: str, flag: str) -> int:
    """0..99 from sha1(f"{flag}:{user_id}")."""
    raise NotImplementedError


def evaluate(flag: str, config: dict, user_id: str) -> bool:
    """config: {"enabled": bool, "deny": [...], "allow": [...], "percent": 0..100}.
    Order: disabled -> False; deny -> False; allow -> True; else bucket < percent."""
    raise NotImplementedError


def rolling_plan(replicas: int, max_surge: int, max_unavailable: int) -> list[tuple[int, int]]:
    """Simulate a rollout where new pods are ready immediately. Start at (old=replicas, new=0).
    Each step: scale new up to fill replicas + max_surge total pods (never above replicas new),
    then scale old down to max(0, replicas - max_unavailable - new). Record (old, new) after each step
    until (0, replicas). Raise ValueError if max_surge == max_unavailable == 0."""
    raise NotImplementedError


def canary_decision(baseline: tuple[int, int], canary: tuple[int, int], max_ratio: float = 1.5,
                    min_requests: int = 100, tolerance: float = 0.001) -> str:
    """(errors, requests) each. 'wait' if canary requests < min_requests; 'rollback' if
    canary_rate > baseline_rate * max_ratio + tolerance; else 'promote'."""
    raise NotImplementedError


class BlueGreen:
    def __init__(self, version: str):
        self.envs = {"blue": version, "green": None}
        self.active = "blue"

    def deploy(self, version: str) -> str:
        """Deploy to the idle color; return it."""
        raise NotImplementedError

    def switch(self) -> str:
        raise NotImplementedError

    def rollback(self) -> str:
        raise NotImplementedError

    def serving(self) -> str:
        return self.envs[self.active]
