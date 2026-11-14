import sqlite3

import pytest
from db_practice import (ConnectionPool, PoolTimeout, add_author_index, keyset_page, load_posts_join,
                         load_posts_n_plus_1, query_plan, setup)


@pytest.fixture
def conn():
    c = sqlite3.connect(":memory:")
    setup(c, authors=10, posts_per_author=3)
    return c


def test_index_changes_plan(conn):
    sql = "SELECT * FROM posts WHERE author_id = ?"
    assert "SCAN" in query_plan(conn, sql, (3,))
    add_author_index(conn)
    plan = query_plan(conn, sql, (3,))
    assert "SEARCH" in plan and "idx_posts_author" in plan


def test_n_plus_1_vs_join(conn):
    statements = []
    conn.set_trace_callback(lambda s: statements.append(s) if s.lstrip().upper().startswith("SELECT") else None)
    a = load_posts_n_plus_1(conn)
    n1 = len(statements)
    statements.clear()
    b = load_posts_join(conn)
    assert a == b and a[0] == ("post1", "author1") and len(a) == 30
    assert n1 == 31 and len(statements) == 1


def test_keyset(conn):
    assert keyset_page(conn, 0, 5) == [1, 2, 3, 4, 5]
    assert keyset_page(conn, 28, 5) == [29, 30]


def test_pool_bounds_and_reuse():
    made = []
    pool = ConnectionPool(lambda: made.append(object()) or made[-1], size=2)
    a, b = pool.acquire(), pool.acquire()
    with pytest.raises(PoolTimeout):
        pool.acquire(timeout=0.05)
    pool.release(a)
    assert pool.acquire(timeout=0.05) is a
    assert len(made) == 2
