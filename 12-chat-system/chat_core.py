"""Storage + presence logic, testable without sockets."""
from collections import defaultdict


class MessageStore:
    def __init__(self):
        self.channels: dict[str, list[dict]] = defaultdict(list)

    def append(self, channel_id: str, sender: str, text: str) -> int:
        """Assign the next per-channel message_id (1, 2, 3...) and store. Return it."""
        raise NotImplementedError

    def since(self, channel_id: str, cur_max_message_id: int) -> list[dict]:
        """All messages with message_id > cur_max_message_id, ascending."""
        raise NotImplementedError


class Presence:
    """A user is online if a heartbeat arrived within `timeout` seconds."""

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
        self.last_seen: dict[str, float] = {}

    def heartbeat(self, user: str, now: float) -> None:
        raise NotImplementedError

    def is_online(self, user: str, now: float) -> bool:
        raise NotImplementedError

    def online_among(self, users: list[str], now: float) -> list[str]:
        raise NotImplementedError
