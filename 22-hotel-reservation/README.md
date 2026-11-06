# 22 · Hotel Reservation System

> Notes: [Hotel Reservation System](https://github.com/liquidslr/system-design-notes/tree/main/22.%20Hotel%20Reservation%20System) · Phase 5: Money and correctness · Suggested time: 1 week

## Goal
Build a booking service that never double-books, even under heavy concurrency, and compare pessimistic locking, optimistic locking and DB constraints with real measurements.

## What you'll build
- Postgres schema from the chapter: hotel, room_type, `room_type_inventory(hotel_id, room_type_id, date, total_inventory, total_reserved)`, reservation.
- Reservation API with an idempotency key (`reservation_id` generated client-side) so double-clicks don't book twice.
- Three concurrency strategies behind a flag: `SELECT ... FOR UPDATE`, optimistic `version` column, and a `CHECK (total_reserved <= total_inventory * 1.1)` constraint (10% overbooking).
- A concurrency test that fires 200 parallel bookings at the last room and counts successes.
- Reservation status state machine (pending -> paid / canceled / rejected / refunded).

## Key concepts exercised
- Double-booking by one user (idempotency) and by many users (concurrency)
- Pessimistic vs optimistic locking vs constraints
- Overbooking
- Caching inventory in Redis with DB as source of truth
- Microservices data consistency (2PC vs Saga)

## Milestones
- [ ] Make `pytest 22-hotel-reservation` pass (in-memory inventory with idempotency + optimistic locking, plus a threaded overbooking test).
- [ ] Move to Postgres and implement all three strategies; run the 200-parallel-bookings test for each.
- [ ] Record throughput and retry counts per strategy in this README.
- [ ] Add a Redis inventory cache and show how stale cache is handled.

## Stretch goals
- [ ] Split into reservation and payment services and implement a Saga with compensations.
- [ ] Shard by hotel_id.
- [ ] Hold rooms for 10 minutes during checkout with automatic release.

## Suggested stack
Python 3.11, FastAPI, Postgres, Redis, pytest

## Starter files
- `inventory.py`
- `tests/test_inventory.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 22-hotel-reservation
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
