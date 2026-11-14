# 49 · Schema Evolution: Migrations & Versioning

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=49-schema-evolution)

**Concepts covered:** #81 Database Migrations · #82 Schema Versioning

## Goal
Change databases and data formats without downtime: a versioned migration runner with checksums and rollback, the expand/contract pattern, and upcasters for versioned records and events.

## 1. Concepts
### Database migrations
Ordered, versioned scripts that move a schema forward (and ideally back), recorded in a table so every environment knows where it is. Run them in CI and before deploys; never edit an applied migration (checksums catch it).

### Schema versioning
Data outlives code: stored records, events and API payloads carry a schema version. Readers upgrade old versions on read (upcasting) or you backfill. Compatibility rules: backward (new code reads old data) and forward (old code tolerates new data).

## 2. Trade-offs and optimizations
- Expand/contract: add the new column, dual-write, backfill, switch reads, then drop the old one in a later release; every step is compatible with the running code.
- Big migrations (adding an index to a huge table) need online tools (`CREATE INDEX CONCURRENTLY`, gh-ost, pt-online-schema-change).
- Down migrations are nice in dev but data-destroying in prod; prefer roll-forward fixes.
- Upcasting on read keeps old data untouched; backfills make reads simpler but take time and I/O.
- Schema registries (Avro/Protobuf) enforce compatibility for events.

## 3. Demo
A step-by-step expand/contract migration on an in-browser SQLite database while a simulated old and new app version keep reading and writing: try the unsafe one-step rename and watch the old version crash, then do it safely. A second panel upcasts v1/v2/v3 records.

- **In the browser:** [49-schema-evolution on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=49-schema-evolution). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`database.js`](demo/database.js), [`app_versions.js`](demo/app_versions.js), [`migration.js`](demo/migration.js), [`upcast.js`](demo/upcast.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=49-schema-evolution>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `migrations.py`: a migration runner on sqlite3 with a schema_migrations table, checksums, migrate-to-target and rollback, plus a chain of record upcasters.
- Alembic migrations for the chapter 8 Postgres schema, including an expand/contract column rename.

### Milestones
- [ ] Make `pytest 49-schema-evolution` pass.
- [ ] Add Alembic to the chapter 8 service and generate a migration from model changes.
- [ ] Rename a column with expand/contract across three deploys with zero errors under load.

### Starter files
- [`migrations.py`](migrations.py)
- [`tests/test_migrations.py`](tests/test_migrations.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 49-schema-evolution
```

### Stretch goals
- [ ] Online schema change with gh-ost on MySQL.
- [ ] Avro schema registry with compatibility checks in CI.
- [ ] Event versioning in the chapter 27 event store.

### Suggested stack
Python 3.11 (sqlite3), Alembic, Postgres, pytest

## 5. Break it
- [ ] Edit an already-applied migration and run the checksum verification.
- [ ] Rename a column in one step while the old version is running.
- [ ] Add a NOT NULL column without a default to a large table and time the lock.

## 6. Review
- Why must a migration never be edited after it's applied?
- Walk through expand/contract for renaming a column.
- Upcasting vs backfilling: when would you choose each?
- What's the difference between backward and forward compatibility?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
