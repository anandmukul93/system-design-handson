# 15 · Design Google Drive

> Notes: [Design Google Drive](https://github.com/liquidslr/system-design-notes/tree/main/15.%20Google%20Drive) · Phase 2: Classic product systems · Suggested time: 1-2 weeks

## Goal
Build a Dropbox-like sync client and server: block-level chunking with dedupe, delta upload, file versioning, conflict detection and change notifications via long polling.

## What you'll build
- Chunker that splits files into blocks (fixed 4 MB first, content-defined chunking as a stretch) and hashes each block.
- Block server that stores compressed blocks in MinIO keyed by hash (dedupe for free).
- Metadata DB: users, devices, files, file_versions, blocks, with optimistic concurrency on file version.
- A sync client (watchdog) that computes block diffs and uploads only changed blocks.
- Notification service using long polling so other devices pull changes.

## Key concepts exercised
- Block-level storage, dedupe, delta sync
- Strong consistency for metadata
- Sync conflicts (first writer wins + conflict copy)
- Long polling
- Versioning and storage cost
- Upload resumability

## Milestones
- [ ] Make `pytest 15-google-drive` pass (chunking + diff + conflict check).
- [ ] Run server + MinIO; upload a 100 MB file, change 1 byte, re-sync and confirm only one block uploads.
- [ ] Run two clients; edit the same file concurrently and produce a conflict copy.
- [ ] Add long-polling `/changes?cursor=` and watch the second client update live.

## Stretch goals
- [ ] Content-defined chunking (Rabin/FastCDC) and compare dedupe ratio after inserting bytes at the start.
- [ ] Keep only N versions and garbage-collect unreferenced blocks.
- [ ] Cold storage tier for blocks not read in 90 days.

## Suggested stack
Python 3.11, FastAPI, Postgres, MinIO, watchdog, pytest

## Starter files
- `sync_core.py`
- `tests/test_sync_core.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 15-google-drive
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
