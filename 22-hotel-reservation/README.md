# 22 · Hotel Reservation System

> Phase 5: Money and correctness · Suggested time: 1 week · Notes: [Hotel Reservation System](https://github.com/liquidslr/system-design-notes/tree/main/22.%20Hotel%20Reservation%20System) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=22-hotel-reservation)

**Concepts covered:** #14 Idempotency · #36 Optimistic Locking · #37 Pessimistic Locking

## Goal
Build a booking service that never double-books, even under heavy concurrency, and compare pessimistic locking, optimistic locking and DB constraints with real measurements.

## 1. Concepts
### Double booking
Two users (or one user double-clicking) must not reserve the last room twice.

### Idempotency keys
The client generates a reservation id once, so retries and double-clicks hit the same record.

### Locking strategies
Pessimistic `SELECT ... FOR UPDATE`, optimistic version checks, or a DB constraint on reserved <= inventory.

### Overbooking
Hotels allow ~10% overbooking; encode it in the constraint.

### Consistency across services
Reservation and payment in different services need a saga or 2PC.

## 2. Trade-offs and optimizations
- Optimistic locking is fast with low contention and retries a lot at high contention.
- Pessimistic locking serialises and can deadlock.
- Constraints are simplest but give generic errors.

## 3. Demo
Unleash dozens of simulated users on the last rooms of a hotel. Switch between no locking, pessimistic locking, optimistic locking and a DB constraint, and watch double bookings, retries and throughput for each.

- **In the browser:** [22-hotel-reservation on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=22-hotel-reservation). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=22-hotel-reservation>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Postgres schema from the chapter: hotel, room_type, `room_type_inventory(hotel_id, room_type_id, date, total_inventory, total_reserved)`, reservation.
- Reservation API with an idempotency key (`reservation_id` generated client-side) so double-clicks don't book twice.
- Three concurrency strategies behind a flag: `SELECT ... FOR UPDATE`, optimistic `version` column, and a `CHECK (total_reserved <= total_inventory * 1.1)` constraint (10% overbooking).
- A concurrency test that fires 200 parallel bookings at the last room and counts successes.
- Reservation status state machine (pending -> paid / canceled / rejected / refunded).

### Milestones
- [ ] Make `pytest 22-hotel-reservation` pass (in-memory inventory with idempotency + optimistic locking, plus a threaded overbooking test).
- [ ] Move to Postgres and implement all three strategies; run the 200-parallel-bookings test for each.
- [ ] Record throughput and retry counts per strategy in this README.
- [ ] Add a Redis inventory cache and show how stale cache is handled.

### Starter files
- [`inventory.py`](inventory.py)
- [`tests/test_inventory.py`](tests/test_inventory.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 22-hotel-reservation
```

### Stretch goals
- [ ] Split into reservation and payment services and implement a Saga with compensations.
- [ ] Shard by hotel_id.
- [ ] Hold rooms for 10 minutes during checkout with automatic release.

### Suggested stack
Python 3.11, FastAPI, Postgres, Redis, pytest

## 5. Break it
- [ ] Turn off locking and fire 200 parallel bookings.
- [ ] Double-click 'Book' without an idempotency key.
- [ ] Raise contention and watch optimistic retries explode.

## 6. Review
- How does an idempotency key prevent double booking by one user?
- Optimistic vs pessimistic locking here?
- How would you implement 10% overbooking?
- How do reservation and payment stay consistent?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/22.%20Hotel%20Reservation%20System).

## Results
_Write your measurements, failure experiments and surprises here._
