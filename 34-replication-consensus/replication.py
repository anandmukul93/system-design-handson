import bisect
import hashlib


def majority(n: int) -> int:
    raise NotImplementedError


class RaftNode:
    def __init__(self, node_id: str, log_terms: list[int] | None = None):
        self.id = node_id
        self.current_term = 0
        self.voted_for: str | None = None
        self.log_terms = list(log_terms or [])   # term of each log entry, index 1..len

    def handle_request_vote(self, term: int, candidate: str, last_log_index: int, last_log_term: int) -> tuple[int, bool]:
        """Raft RequestVote. Return (current_term, vote_granted).
        - term < current_term: reject
        - term > current_term: adopt term, clear voted_for
        - grant if not yet voted for someone else this term AND candidate log is at least as up to date
          (higher last term, or same last term and index >= ours)"""
        raise NotImplementedError


def hash_partition(key: str, partitions: int) -> int:
    """md5 of key as int, mod partitions."""
    raise NotImplementedError


def range_partition(key: str, boundaries: list[str]) -> int:
    """boundaries are sorted split points; partition i holds keys < boundaries[i] (last holds the rest)."""
    raise NotImplementedError


class ReadYourWritesRouter:
    def __init__(self, window_s: float):
        self.window_s = window_s
        self.last_write: dict[str, float] = {}

    def record_write(self, user: str, now: float) -> None:
        raise NotImplementedError

    def route_read(self, user: str, now: float) -> str:
        """'primary' within window_s of the user's last write, else 'replica'."""
        raise NotImplementedError
