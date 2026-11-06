"""Per-user mailbox core with threading and a toy inverted index."""
import itertools
import re
from collections import defaultdict


class Mailbox:
    def __init__(self):
        self._ids = itertools.count(1)
        self.emails: dict[int, dict] = {}
        self.by_message_id: dict[str, int] = {}
        self.index: dict[str, set[int]] = defaultdict(set)

    def deliver(self, user: str, folder: str, message_id: str, subject: str, body: str,
                ts: float, in_reply_to: str | None = None) -> int:
        """Store email, assign thread_id (same as parent's thread if in_reply_to is known,
        else its own email_id), index lowercase word tokens of subject + body.
        New emails are unread."""
        raise NotImplementedError

    def list_folder(self, user: str, folder: str, unread_only: bool = False) -> list[dict]:
        """Newest first."""
        raise NotImplementedError

    def mark_read(self, email_id: int) -> None:
        raise NotImplementedError

    def thread(self, thread_id: int) -> list[dict]:
        """Oldest first."""
        raise NotImplementedError

    def search(self, user: str, query: str) -> list[int]:
        """Email ids of `user` containing ALL query words, newest first."""
        raise NotImplementedError
