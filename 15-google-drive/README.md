# 15 · Design Google Drive

> Phase 2: Classic product systems · Suggested time: 1-2 weeks · Notes: [Design Google Drive](https://github.com/liquidslr/system-design-notes/tree/main/15.%20Google%20Drive) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=15-google-drive)

**Concepts covered:** #23 Long Polling

## Goal
Build a Dropbox-like sync client and server: block-level chunking with dedupe, delta upload, file versioning, conflict detection and change notifications via long polling.

## 1. Concepts
### Block-level storage
Split files into blocks, hash each, store blocks by hash: identical blocks are stored once.

### Delta sync
On change, upload only blocks whose hashes changed.

### Metadata consistency
File versions and block lists live in a strongly consistent DB with optimistic concurrency so concurrent edits are detected.

### Conflicts and notifications
If two devices edit the same version, keep both (conflict copy); long polling tells other devices to pull changes.

## 2. Trade-offs and optimizations
- Smaller blocks = better dedupe, more metadata.
- Content-defined chunking survives insertions; fixed blocks don't.
- Keeping many versions costs storage.

## 3. Demo
Edit a file on two simulated devices: blocks light up as changed or deduped, only changed blocks upload, and concurrent edits produce a conflict copy. A meter shows bytes uploaded vs file size.

- **In the browser:** [15-google-drive on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=15-google-drive). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=15-google-drive>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Chunker that splits files into blocks (fixed 4 MB first, content-defined chunking as a stretch) and hashes each block.
- Block server that stores compressed blocks in MinIO keyed by hash (dedupe for free).
- Metadata DB: users, devices, files, file_versions, blocks, with optimistic concurrency on file version.
- A sync client (watchdog) that computes block diffs and uploads only changed blocks.
- Notification service using long polling so other devices pull changes.

### Milestones
- [ ] Make `pytest 15-google-drive` pass (chunking + diff + conflict check).
- [ ] Run server + MinIO; upload a 100 MB file, change 1 byte, re-sync and confirm only one block uploads.
- [ ] Run two clients; edit the same file concurrently and produce a conflict copy.
- [ ] Add long-polling `/changes?cursor=` and watch the second client update live.

### Starter files
- [`sync_core.py`](sync_core.py)
- [`tests/test_sync_core.py`](tests/test_sync_core.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 15-google-drive
```

### Stretch goals
- [ ] Content-defined chunking (Rabin/FastCDC) and compare dedupe ratio after inserting bytes at the start.
- [ ] Keep only N versions and garbage-collect unreferenced blocks.
- [ ] Cold storage tier for blocks not read in 90 days.

### Suggested stack
Python 3.11, FastAPI, Postgres, MinIO, watchdog, pytest

## 5. Break it
- [ ] Insert a byte at the start with fixed-size blocks and count re-uploads.
- [ ] Edit the same file on two offline devices.
- [ ] Kill the client mid-upload and resume.

## 6. Review
- Why split files into blocks?
- How is a sync conflict detected?
- Why does metadata need strong consistency?
- What's long polling used for here?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/15.%20Google%20Drive).

## Results
_Write your measurements, failure experiments and surprises here._
