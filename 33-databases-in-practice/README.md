# 33 · Databases in Practice

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=33-databases-in-practice)

**Concepts covered:** #25 Database Indexing · #26 Query Optimization · #27 N+1 Queries · #28 Connection Pooling · #29 Read Replicas

## Goal
Make a slow database fast with your own hands: add the right index, read query plans, kill an N+1, page with keyset pagination, pool connections, and route reads to replicas.

## 1. Concepts
### Database indexing
A B-tree index keeps a sorted copy of some columns pointing at rows, turning a full scan into a log-time seek. Composite indexes work left to right; covering indexes answer queries without touching the table. Every index slows writes.

### Query optimization
Read the plan (`EXPLAIN`/`EXPLAIN QUERY PLAN`) before guessing. Typical wins: an index matching the WHERE + ORDER BY, avoiding functions on indexed columns, keyset pagination instead of large OFFSETs, and selecting only needed columns.

### N+1 queries
Loading a list then issuing one query per item (often hidden in an ORM) turns 1 request into N+1 round trips. Fix with a JOIN, `WHERE id IN (...)` batching, or eager loading.

### Connection pooling
Opening a DB connection costs a handshake, auth and server memory. A pool keeps a bounded set open and lends them out; size it with Little's law and make callers time out instead of piling up.

### Read replicas
Copies that apply the primary's log asynchronously. They scale reads but lag, so route a user's reads to the primary for a short window after they write (read-your-writes).

### Partitioning
Splitting a big table into pieces by range (dates) or hash inside one database: queries that filter on the partition key touch fewer pages, and old partitions drop instantly.

## 2. Trade-offs and optimizations
- Indexes speed reads and slow writes; measure both.
- OFFSET 100000 still reads 100000 rows; keyset pagination (`WHERE id > ?`) doesn't.
- Pool too small: queueing. Too big: DB thrashing. Most Postgres setups want tens, not hundreds (use PgBouncer).
- Replica lag is unbounded under load; monitor it and fall back to the primary.
- Partition pruning only works if queries filter on the partition key.

## 3. Demo
A real SQLite database running in your browser (sql.js). Toggle indexes and watch the query plan change from SCAN to SEARCH; compare the N+1 loader with a JOIN by counting queries; compare OFFSET with keyset pagination; and run a connection pool simulator with adjustable pool size and load.

- **In the browser:** [33-databases-in-practice on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=33-databases-in-practice). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`seed.js`](demo/seed.js), [`index_plan.js`](demo/index_plan.js), [`query_loading.js`](demo/query_loading.js), [`pagination.js`](demo/pagination.js), [`connection_pool.js`](demo/connection_pool.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=33-databases-in-practice>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `db_practice.py` on stdlib sqlite3: index + plan inspection, an N+1 loader vs a JOIN loader with query counting, keyset pagination, and a bounded connection pool with timeouts.
- A Postgres version with 10M rows, `EXPLAIN ANALYZE` before/after, plus a primary + replica pair from chapter 1.

### Milestones
- [ ] Make `pytest 33-databases-in-practice` pass.
- [ ] Load 10M rows into Postgres and capture `EXPLAIN ANALYZE` before and after adding an index.
- [ ] Find an N+1 in an ORM (SQLAlchemy) with query logging and fix it with eager loading.

### Starter files
- [`db_practice.py`](db_practice.py)
- [`tests/test_db_practice.py`](tests/test_db_practice.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 33-databases-in-practice
```

### Stretch goals
- [ ] Partition a table by month in Postgres and measure partition pruning.
- [ ] Try a covering index (`INCLUDE`) and see an index-only scan.
- [ ] Put PgBouncer in transaction mode in front of Postgres.

### Suggested stack
Python 3.11 (sqlite3), Postgres 16, SQLAlchemy (optional), sql.js in the demo, pytest

## 5. Break it
- [ ] Drop the index during a load test and watch p99 explode.
- [ ] Set the pool size to 1 and run 50 concurrent requests; then set it to 500 and watch the DB.
- [ ] Stop the replica's WAL replay and read your own write from it.

## 6. Review
- What does a composite index on (a, b) help with, and what doesn't it?
- How do you spot an N+1 in production?
- Why is OFFSET pagination slow on deep pages?
- How would you size a connection pool?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
