import random
import time
from collections import deque


class CircuitOpen(Exception):
    pass


class CircuitBreaker:
    """closed -> (failure_threshold consecutive failures) -> open -> (reset_timeout) -> half_open.
    half_open: one trial call; success -> closed (failures reset), failure -> open again."""

    def __init__(self, failure_threshold: int = 5, reset_timeout: float = 30, clock=time.monotonic):
        self.failure_threshold, self.reset_timeout, self.clock = failure_threshold, reset_timeout, clock
        self.failures = 0
        self.opened_at = None

    @property
    def state(self) -> str:
        raise NotImplementedError

    def call(self, fn, *args, **kwargs):
        """Raise CircuitOpen without calling fn when open."""
        raise NotImplementedError


def full_jitter_backoff(attempt: int, base: float, cap: float, rng: random.Random) -> float:
    """uniform(0, min(cap, base * 2**attempt))"""
    raise NotImplementedError


def retry(fn, attempts: int, base: float, cap: float, sleep, rng: random.Random, retry_on=(Exception,)):
    """Call fn up to `attempts` times; sleep(full_jitter_backoff(i, ...)) between tries.
    Re-raise the last exception. Exceptions not in retry_on are raised immediately."""
    raise NotImplementedError


class DeadlineExceeded(Exception):
    pass


class Deadline:
    def __init__(self, timeout: float, clock=time.monotonic):
        self.clock = clock
        self.expires_at = clock() + timeout

    def remaining(self) -> float:
        """Never negative."""
        raise NotImplementedError

    def child(self, timeout: float) -> "Deadline":
        """A deadline for a sub-call: the smaller of timeout and what's left."""
        raise NotImplementedError

    def check(self) -> None:
        """Raise DeadlineExceeded if expired."""
        raise NotImplementedError


class BoundedBuffer:
    def __init__(self, capacity: int, policy: str = "reject"):
        assert policy in ("reject", "drop_oldest")
        self.capacity, self.policy = capacity, policy
        self.items: deque = deque()
        self.dropped = 0

    def offer(self, item) -> bool:
        """reject: refuse when full (return False). drop_oldest: evict the oldest and accept."""
        raise NotImplementedError

    def poll(self):
        return self.items.popleft() if self.items else None
