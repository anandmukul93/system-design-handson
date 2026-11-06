# 23 · Distributed Email Service

> Notes: [Distributed Email Service](https://github.com/liquidslr/system-design-notes/tree/main/23.%20Distributed%20Email%20Service) · Phase 2: Classic product systems · Suggested time: 1 week

## Goal
Build a small Gmail: receive mail over SMTP, store metadata and bodies separately, serve folders and threads over a web API with real-time updates, and add full-text search.

## What you'll build
- SMTP inbound server (aiosmtpd) that parses MIME, stores attachments in MinIO and metadata in a DB partitioned by user_id.
- Mail API: list folders, list emails by folder (newest first), mark read/unread, thread by `In-Reply-To`/`References`.
- Outbound queue + SMTP sender worker with retries; SPF/DKIM signing as a learning exercise (dkimpy) against a local MailHog/Mailpit.
- Real-time push of new mail over WebSockets.
- Search: start with SQLite FTS5 / Postgres tsvector, then try OpenSearch.

## Key concepts exercised
- SMTP/IMAP basics
- Metadata DB design (partition by user_id, clustering by time)
- Denormalized read/unread tables
- Threading
- Deliverability: SPF, DKIM, DMARC
- Search index vs primary store

## Milestones
- [ ] Make `pytest 23-distributed-email` pass (mailbox store + threading + search).
- [ ] Run aiosmtpd + Mailpit; send yourself mail with `swaks` and see it in the API.
- [ ] Add the outbound queue and DKIM-sign outgoing mail.
- [ ] Index 100k synthetic emails and compare FTS5 vs OpenSearch latency.

## Stretch goals
- [ ] Spam filter (naive Bayes) on the inbound path.
- [ ] Per-user storage quotas and attachment dedupe by hash.
- [ ] Cassandra/ScyllaDB schema with (user_id, folder_id) partitions.

## Suggested stack
Python 3.11, aiosmtpd, FastAPI, Postgres or SQLite FTS5, MinIO, Mailpit, pytest

## Starter files
- `mail_store.py`
- `tests/test_mailbox.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 23-distributed-email
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
