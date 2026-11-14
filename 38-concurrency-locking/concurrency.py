import threading


class SafeCounter:
    def __init__(self):
        self.value = 0
        self._lock = threading.Lock()

    def increment(self) -> None:
        raise NotImplementedError


class Account:
    def __init__(self, account_id: int, balance: int):
        self.id, self.balance = account_id, balance
        self.lock = threading.Lock()


def transfer(src: Account, dst: Account, amount: int) -> bool:
    """Lock BOTH accounts in a global order (lower id first) to avoid deadlock.
    Return False (no change) if src has insufficient funds."""
    raise NotImplementedError


def find_deadlock(wait_for: dict[str, set[str]]) -> list[str] | None:
    """wait_for[a] = set of parties a waits on. Return one cycle as a list starting at its
    smallest member, e.g. ['a', 'b', 'c'] for a->b->c->a, or None."""
    raise NotImplementedError


class LeaseLock:
    """A lock server with leases and fencing tokens."""

    def __init__(self):
        self.holder: dict[str, tuple[str, float, int]] = {}   # resource -> (owner, expires_at, token)
        self.next_token = 1

    def acquire(self, resource: str, owner: str, now: float, ttl: float) -> int | None:
        """Grant if free or expired (or already held by owner: renew, same token). Return the fencing token."""
        raise NotImplementedError

    def release(self, resource: str, owner: str) -> None:
        raise NotImplementedError


class FencedStore:
    def __init__(self):
        self.value = None
        self.max_token = 0

    def write(self, token: int, value) -> bool:
        """Reject (False) tokens lower than the highest seen."""
        raise NotImplementedError
