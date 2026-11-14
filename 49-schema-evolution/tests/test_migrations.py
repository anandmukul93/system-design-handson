import sqlite3

import pytest
from migrations import ChecksumMismatch, Migrator, upcast

M = [
    (1, "create users", "CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT)", "DROP TABLE users"),
    (2, "add email", "ALTER TABLE users ADD COLUMN email TEXT", "ALTER TABLE users DROP COLUMN email"),
    (3, "index email", "CREATE INDEX idx_users_email ON users(email)", "DROP INDEX idx_users_email"),
]


def cols(conn):
    return [r[1] for r in conn.execute("PRAGMA table_info(users)")]


def test_migrate_and_idempotent():
    conn = sqlite3.connect(":memory:")
    m = Migrator(conn, M)
    assert m.current_version() == 0
    assert m.migrate(2) == [1, 2]
    assert cols(conn) == ["id", "name", "email"]
    assert m.migrate() == [3]
    assert m.migrate() == []
    assert m.current_version() == 3


def test_rollback():
    conn = sqlite3.connect(":memory:")
    m = Migrator(conn, M)
    m.migrate()
    assert m.rollback(1) == [3, 2]
    assert m.current_version() == 1 and cols(conn) == ["id", "name"]


def test_checksum_drift():
    conn = sqlite3.connect(":memory:")
    Migrator(conn, M).migrate()
    edited = [M[0], (2, "add email", "ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''", M[1][3]), M[2]]
    with pytest.raises(ChecksumMismatch):
        Migrator(conn, edited).verify()


def test_upcast():
    v1 = {"id": 1, "name": "Ada Lovelace"}
    assert upcast(v1) == {"id": 1, "first_name": "Ada", "last_name": "Lovelace", "email_verified": False, "schema_version": 3}
    assert v1 == {"id": 1, "name": "Ada Lovelace"}
    assert upcast({"id": 2, "name": "Plato"})["last_name"] == ""
    v3 = {"id": 3, "first_name": "A", "last_name": "B", "email_verified": True, "schema_version": 3}
    assert upcast(v3) == v3
