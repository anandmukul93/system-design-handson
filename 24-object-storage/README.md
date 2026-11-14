# 24 · S3-like Object Storage

> Phase 4: Data infrastructure · Suggested time: 2 weeks · Notes: [S3-like Object Storage](https://github.com/liquidslr/system-design-notes/tree/main/24.%20S3-like%20Object%20Storage) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=24-object-storage)

**Concepts covered:** #72 Encryption at Rest

## Goal
Build a mini S3: a metadata service, data nodes that pack small objects into large append-only files, checksums, versioning, multipart upload and garbage collection.

## 1. Concepts
### Metadata vs data
A metadata service maps bucket/key to object ids and locations; data nodes store bytes.

### Packing small objects
Append many small objects into large files and record (file, offset, size), avoiding millions of tiny files.

### Durability
Replicate across nodes or use erasure coding (e.g. 8+4) for less storage overhead; checksums detect corruption.

### Versioning, multipart and GC
Versions keep history with delete markers; multipart uploads send big files in parallel parts; compaction reclaims deleted space.

## 2. Trade-offs and optimizations
- Replication: simple, 3x storage. Erasure coding: 1.5x, more CPU and slower repair.
- Bigger data files: fewer files, slower compaction.
- Listing large buckets needs prefix-sharded metadata.

## 3. Demo
Upload objects of different sizes and watch them pack into data files, delete some and run compaction to reclaim space, flip a bit to see the checksum catch corruption, and compare replication with erasure coding storage overhead.

- **In the browser:** [24-object-storage on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=24-object-storage). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`data_files.js`](demo/data_files.js), [`durability.js`](demo/durability.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=24-object-storage>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- API service: `PUT/GET/DELETE /{bucket}/{key}`, `GET /{bucket}?prefix=` listing with pagination, versioning on/off per bucket.
- Metadata store (Postgres/SQLite): buckets, objects(bucket, key, version_id, object_id, size, checksum, deleted).
- Data node: appends objects into large read-write files, records (file, offset, size) in a local object_mapping table, seals files at a size limit.
- Replication across 3 data nodes (primary + 2 followers) and a placement service with heartbeats.
- Multipart upload (initiate, upload parts, complete) and a compaction-based garbage collector.

### Milestones
- [ ] Make `pytest 24-object-storage` pass (data node append/read/compact).
- [ ] Build the API + metadata DB; upload and list with the AWS CLI pointed at your endpoint (`--endpoint-url`).
- [ ] Add 3 data nodes with replication; kill one and keep reading.
- [ ] Implement multipart upload and GC; measure space reclaimed.

### Starter files
- [`data_node.py`](data_node.py)
- [`tests/test_data_node.py`](tests/test_data_node.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 24-object-storage
```

### Stretch goals
- [ ] Reed-Solomon (4+2) erasure coding with the `reedsolo` or `pyeclib` library and compare storage overhead.
- [ ] Pre-signed URLs with HMAC signatures.
- [ ] Sharded metadata by hash(bucket, key).

### Suggested stack
Python 3.11, FastAPI, SQLite/Postgres, AWS CLI (as client), pytest

## 5. Break it
- [ ] Corrupt a byte on disk and read the object.
- [ ] Delete half the objects and compact.
- [ ] Kill a data node and read from replicas.

## 6. Review
- Why pack small objects into big files?
- Replication vs erasure coding?
- How does object versioning handle deletes?
- Why multipart uploads?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/24.%20S3-like%20Object%20Storage).

## Results
_Write your measurements, failure experiments and surprises here._
