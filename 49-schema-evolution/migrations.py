import hashlib
import sqlite3


class ChecksumMismatch(Exception):
    pass


class Migrator:
    """migrations: list of (version, name, up_sql, down_sql), versions ascending.
    Applied versions are recorded in schema_migrations(version INTEGER PRIMARY KEY, name TEXT, checksum TEXT).
    checksum = sha256 hex of up_sql."""

    def __init__(self, conn: sqlite3.Connection, migrations: list[tuple[int, str, str, str]]):
        self.conn, self.migrations = conn, migrations
        conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, name TEXT, checksum TEXT)")

    def current_version(self) -> int:
        """0 when nothing is applied."""
        raise NotImplementedError

    def migrate(self, target: int | None = None) -> list[int]:
        """Apply pending migrations up to target (default: latest), each in its own transaction.
        Return versions applied."""
        raise NotImplementedError

    def rollback(self, to_version: int) -> list[int]:
        """Run down_sql for applied versions > to_version, newest first. Return versions rolled back."""
        raise NotImplementedError

    def verify(self) -> None:
        """Raise ChecksumMismatch if an applied migration's up_sql changed."""
        raise NotImplementedError


def upcast(record: dict) -> dict:
    """Bring a user record to schema_version 3 (records without schema_version are v1).
    v1 -> v2: split "name" into "first_name"/"last_name" on the first space (last_name "" if none), drop "name".
    v2 -> v3: add "email_verified": False if missing. Set "schema_version": 3.
    Return a new dict; don't mutate the input."""
    raise NotImplementedError
