"""All on stdlib sqlite3 so it runs anywhere (including the browser)."""
import queue
import sqlite3


def setup(conn: sqlite3.Connection, authors: int = 20, posts_per_author: int = 5) -> None:
    conn.executescript("""
        CREATE TABLE authors(id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE posts(id INTEGER PRIMARY KEY, author_id INTEGER, title TEXT);
    """)
    conn.executemany("INSERT INTO authors VALUES (?, ?)", [(i, f"author{i}") for i in range(1, authors + 1)])
    rows, pid = [], 1
    for a in range(1, authors + 1):
        for _ in range(posts_per_author):
            rows.append((pid, a, f"post{pid}")); pid += 1
    conn.executemany("INSERT INTO posts VALUES (?, ?, ?)", rows)
    conn.commit()


def query_plan(conn: sqlite3.Connection, sql: str, params=()) -> str:
    """Join the 'detail' column of EXPLAIN QUERY PLAN rows with '; '."""
    raise NotImplementedError


def add_author_index(conn: sqlite3.Connection) -> None:
    """Create idx_posts_author on posts(author_id)."""
    raise NotImplementedError


def load_posts_n_plus_1(conn) -> list[tuple[str, str]]:
    """[(post title, author name)] ordered by post id, using one query for posts and one per post for its author."""
    raise NotImplementedError


def load_posts_join(conn) -> list[tuple[str, str]]:
    """Same result with a single JOIN query."""
    raise NotImplementedError


def keyset_page(conn, after_id: int, limit: int) -> list[int]:
    """Post ids greater than after_id, ascending, at most limit. No OFFSET."""
    raise NotImplementedError


class PoolTimeout(Exception):
    pass


class ConnectionPool:
    """Bounded pool. Connections are created lazily up to `size` and reused after release."""

    def __init__(self, factory, size: int):
        self.factory, self.size = factory, size
        self.created = 0
        self.idle: queue.Queue = queue.Queue()

    def acquire(self, timeout: float = 1.0):
        raise NotImplementedError

    def release(self, conn) -> None:
        raise NotImplementedError
