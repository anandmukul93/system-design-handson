"""All five algorithms from the chapter. Every limiter takes an injectable clock
so tests are deterministic. `allow(key)` returns True if the request may proceed."""
import time
from typing import Callable

Clock = Callable[[], float]


class TokenBucket:
    """`capacity` tokens, refilled at `refill_rate` tokens/second. Each request costs 1."""

    def __init__(self, capacity: int, refill_rate: float, clock: Clock = time.monotonic):
        self.capacity, self.refill_rate, self.clock = capacity, refill_rate, clock
        self.buckets: dict[str, tuple[float, float]] = {}  # key -> (tokens, last_refill)

    def allow(self, key: str) -> bool:
        raise NotImplementedError


class LeakingBucket:
    """FIFO queue of size `capacity`, drained at `leak_rate` requests/second.
    allow() returns True if the request fits in the queue."""

    def __init__(self, capacity: int, leak_rate: float, clock: Clock = time.monotonic):
        self.capacity, self.leak_rate, self.clock = capacity, leak_rate, clock

    def allow(self, key: str) -> bool:
        raise NotImplementedError


class FixedWindow:
    def __init__(self, limit: int, window: float, clock: Clock = time.monotonic):
        self.limit, self.window, self.clock = limit, window, clock

    def allow(self, key: str) -> bool:
        raise NotImplementedError


class SlidingWindowLog:
    def __init__(self, limit: int, window: float, clock: Clock = time.monotonic):
        self.limit, self.window, self.clock = limit, window, clock

    def allow(self, key: str) -> bool:
        raise NotImplementedError


class SlidingWindowCounter:
    """estimate = current_count + previous_count * overlap_fraction_of_previous_window"""

    def __init__(self, limit: int, window: float, clock: Clock = time.monotonic):
        self.limit, self.window, self.clock = limit, window, clock

    def allow(self, key: str) -> bool:
        raise NotImplementedError
