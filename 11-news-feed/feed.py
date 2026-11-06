"""Hybrid fan-out feed, in memory. Swap dicts for Redis later."""
import itertools
from collections import defaultdict


class FeedService:
    def __init__(self, celebrity_threshold: int = 1000, feed_cap: int = 500):
        self.celebrity_threshold = celebrity_threshold
        self.feed_cap = feed_cap
        self.followers: dict[str, set[str]] = defaultdict(set)   # author -> followers
        self.following: dict[str, set[str]] = defaultdict(set)   # user -> authors
        self.posts: dict[int, dict] = {}                           # post_id -> {author, text, ts}
        self.user_posts: dict[str, list[int]] = defaultdict(list)
        self.feeds: dict[str, list[int]] = defaultdict(list)     # precomputed (newest first)
        self._ids = itertools.count(1)
        self.fanout_writes = 0

    def follow(self, user: str, author: str) -> None:
        self.followers[author].add(user)
        self.following[user].add(author)

    def is_celebrity(self, author: str) -> bool:
        return len(self.followers[author]) >= self.celebrity_threshold

    def publish(self, author: str, text: str, ts: float) -> int:
        """Store the post. If author is NOT a celebrity, push id to each follower's feed
        (respect feed_cap, increment fanout_writes per push). Return post id."""
        raise NotImplementedError

    def get_feed(self, user: str, limit: int = 20) -> list[dict]:
        """Merge precomputed feed with recent posts from followed celebrities.
        Return newest-first list of post dicts (include "id")."""
        raise NotImplementedError
