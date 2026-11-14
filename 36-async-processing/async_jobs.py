import itertools
from datetime import datetime, timedelta

# ---- cron ---------------------------------------------------------------
FIELDS = [(0, 59), (0, 23), (1, 31), (1, 12), (0, 6)]   # minute hour dom month dow (0 = Sunday)


def parse_field(expr: str, lo: int, hi: int) -> set[int]:
    """Support '*', '*/n', 'a', 'a-b', 'a-b/n' and comma lists."""
    raise NotImplementedError


def cron_matches(expr: str, dt: datetime) -> bool:
    """All five fields must match (simplified: day-of-month AND day-of-week).
    Python weekday(): Monday=0; cron: Sunday=0."""
    raise NotImplementedError


def next_run(expr: str, after: datetime) -> datetime:
    """First minute strictly after `after` (seconds dropped) that matches. Search up to 366 days."""
    raise NotImplementedError


# ---- work queue ---------------------------------------------------------
class WorkQueue:
    def __init__(self, visibility_timeout: float = 30, max_receives: int = 3):
        self.visibility_timeout, self.max_receives = visibility_timeout, max_receives
        self._ids = itertools.count(1)
        self.messages: dict[int, dict] = {}     # id -> {"body", "visible_at", "receives"}
        self.dlq: list[dict] = []

    def send(self, body, now: float = 0) -> int:
        raise NotImplementedError

    def receive(self, now: float) -> dict | None:
        """Oldest visible message as {"id", "body", "receives"}; hide it until now + visibility_timeout.
        A visible message that has already been received max_receives times moves to self.dlq instead."""
        raise NotImplementedError

    def delete(self, msg_id: int) -> None:
        raise NotImplementedError


# ---- pub/sub ------------------------------------------------------------
class EventBus:
    def __init__(self):
        self.subs: dict[str, list] = {}
        self.failures: list[tuple[str, Exception]] = []

    def subscribe(self, topic: str, handler) -> None:
        raise NotImplementedError

    def publish(self, topic: str, event) -> int:
        """Deliver to every subscriber; a failing handler is recorded in failures and doesn't stop the others.
        Return how many handlers succeeded."""
        raise NotImplementedError
