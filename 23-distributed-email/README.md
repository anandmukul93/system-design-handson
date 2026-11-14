# 23 · Distributed Email Service

> Phase 2: Classic product systems · Suggested time: 1 week · Notes: [Distributed Email Service](https://github.com/liquidslr/system-design-notes/tree/main/23.%20Distributed%20Email%20Service) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=23-distributed-email)

**Concepts covered:** Foundations for the rest of the course

## Goal
Build a small Gmail: receive mail over SMTP, store metadata and bodies separately, serve folders and threads over a web API with real-time updates, and add full-text search.

## 1. Concepts
### Email protocols
SMTP sends and relays mail; IMAP/POP fetch it; modern webmail uses HTTP APIs over a custom store.

### Metadata vs bodies
Store small metadata (folders, flags, threads) in a DB partitioned by user, and bodies/attachments in object storage.

### Threading
Group messages with In-Reply-To and References headers.

### Deliverability
SPF, DKIM and DMARC prove you're allowed to send; reputation and feedback loops keep you out of spam.

### Search
A per-user inverted index serves full-text queries.

## 2. Trade-offs and optimizations
- Partitioning by user keeps queries local but makes cross-user features hard.
- Search index is eventually consistent with the store.
- Attachment dedupe saves storage.

## 3. Demo
A mailbox UI fed by simulated incoming mail: messages thread together by reply headers, unread counts update, and a search box queries an inverted index that you can watch being built as mail arrives.

- **In the browser:** [23-distributed-email on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=23-distributed-email). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=23-distributed-email>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- SMTP inbound server (aiosmtpd) that parses MIME, stores attachments in MinIO and metadata in a DB partitioned by user_id.
- Mail API: list folders, list emails by folder (newest first), mark read/unread, thread by `In-Reply-To`/`References`.
- Outbound queue + SMTP sender worker with retries; SPF/DKIM signing as a learning exercise (dkimpy) against a local MailHog/Mailpit.
- Real-time push of new mail over WebSockets.
- Search: start with SQLite FTS5 / Postgres tsvector, then try OpenSearch.

### Milestones
- [ ] Make `pytest 23-distributed-email` pass (mailbox store + threading + search).
- [ ] Run aiosmtpd + Mailpit; send yourself mail with `swaks` and see it in the API.
- [ ] Add the outbound queue and DKIM-sign outgoing mail.
- [ ] Index 100k synthetic emails and compare FTS5 vs OpenSearch latency.

### Starter files
- [`mail_store.py`](mail_store.py)
- [`tests/test_mailbox.py`](tests/test_mailbox.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 23-distributed-email
```

### Stretch goals
- [ ] Spam filter (naive Bayes) on the inbound path.
- [ ] Per-user storage quotas and attachment dedupe by hash.
- [ ] Cassandra/ScyllaDB schema with (user_id, folder_id) partitions.

### Suggested stack
Python 3.11, aiosmtpd, FastAPI, Postgres or SQLite FTS5, MinIO, Mailpit, pytest

## 5. Break it
- [ ] Send mail without DKIM and see it flagged.
- [ ] Break the References header and watch threading fail.
- [ ] Search before the index catches up.

## 6. Review
- Why separate metadata from bodies?
- How does threading work?
- What do SPF and DKIM prove?
- Why partition by user id?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/23.%20Distributed%20Email%20Service).

## Results
_Write your measurements, failure experiments and surprises here._
