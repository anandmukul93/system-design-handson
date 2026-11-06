"""Core delivery logic, independent of the queue technology."""
from dataclasses import dataclass, field


class ProviderError(Exception):
    pass


@dataclass
class Notification:
    event_id: str
    user_id: str
    channel: str  # "push" | "sms" | "email"
    body: str
    attempts: int = 0


@dataclass
class Dispatcher:
    providers: dict           # channel -> callable(Notification) raising ProviderError on failure
    opted_out: set = field(default_factory=set)   # {(user_id, channel)}
    max_attempts: int = 5
    sent_ids: set = field(default_factory=set)
    dead_letters: list = field(default_factory=list)

    def backoff_seconds(self, attempts: int) -> float:
        """Exponential: 1, 2, 4, 8... capped at 60."""
        raise NotImplementedError

    def handle(self, n: Notification) -> str:
        """Return one of: "sent", "duplicate", "opted_out", "retry", "dead".
        - skip already-sent event_ids (dedupe)
        - skip opted-out user/channel
        - on ProviderError: increment attempts; "dead" (and append to dead_letters)
          once attempts >= max_attempts, else "retry"
        """
        raise NotImplementedError
