# 24 · S3-like Object Storage

> Notes: [S3-like Object Storage](https://github.com/liquidslr/system-design-notes/tree/main/24.%20S3-like%20Object%20Storage) · Phase 4: Data infrastructure · Suggested time: 2 weeks

## Goal
Build a mini S3: a metadata service, data nodes that pack small objects into large append-only files, checksums, versioning, multipart upload and garbage collection.

## What you'll build
- API service: `PUT/GET/DELETE /{bucket}/{key}`, `GET /{bucket}?prefix=` listing with pagination, versioning on/off per bucket.
- Metadata store (Postgres/SQLite): buckets, objects(bucket, key, version_id, object_id, size, checksum, deleted).
- Data node: appends objects into large read-write files, records (file, offset, size) in a local object_mapping table, seals files at a size limit.
- Replication across 3 data nodes (primary + 2 followers) and a placement service with heartbeats.
- Multipart upload (initiate, upload parts, complete) and a compaction-based garbage collector.

## Key concepts exercised
- Separating metadata from data
- Small-object packing into large files
- Durability: replication vs erasure coding
- Checksums for corruption detection
- Versioning and delete markers
- Multipart upload
- Garbage collection / compaction

## Milestones
- [ ] Make `pytest 24-object-storage` pass (data node append/read/compact).
- [ ] Build the API + metadata DB; upload and list with the AWS CLI pointed at your endpoint (`--endpoint-url`).
- [ ] Add 3 data nodes with replication; kill one and keep reading.
- [ ] Implement multipart upload and GC; measure space reclaimed.

## Stretch goals
- [ ] Reed-Solomon (4+2) erasure coding with the `reedsolo` or `pyeclib` library and compare storage overhead.
- [ ] Pre-signed URLs with HMAC signatures.
- [ ] Sharded metadata by hash(bucket, key).

## Suggested stack
Python 3.11, FastAPI, SQLite/Postgres, AWS CLI (as client), pytest

## Starter files
- `data_node.py`
- `tests/test_data_node.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 24-object-storage
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
