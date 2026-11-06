# 16 · Proximity Service

> Notes: [Proximity Service](https://github.com/liquidslr/system-design-notes/tree/main/16.%20Proximity%20Service) · Phase 3: Geo and real-time location · Suggested time: 1 week

## Goal
Build a Yelp-style "businesses near me" service and implement geohash and quadtree indexes yourself, then compare them with PostGIS.

## What you'll build
- Business CRUD service (Postgres) and a read-only Location Based Service (LBS).
- Geohash encode/decode + neighbor cells; search radius picks precision and queries 9 cells.
- An in-memory quadtree built at startup, with k-nearest search.
- Load 1M synthetic (or OpenStreetMap POI) businesses and benchmark: naive lat/lng range scan vs geohash vs quadtree vs PostGIS GiST.
- Redis cache: geohash -> business IDs, business ID -> object.

## Key concepts exercised
- Geohash and boundary issues
- Quadtree
- Evenly divided grid vs adaptive
- Read replicas for read-heavy LBS
- Caching strategy for geospatial data

## Milestones
- [ ] Make `pytest 16-proximity-service` pass (geohash + haversine).
- [ ] Implement neighbors() and radius search; test points across a cell boundary.
- [ ] Build the quadtree and k-NN; benchmark against geohash on 1M points.
- [ ] Compare with PostGIS `ST_DWithin` and write up the trade-offs.

## Stretch goals
- [ ] Google S2 cells via the s2sphere library.
- [ ] Business updates propagate to the index nightly vs in real time.
- [ ] Multi-region deployment with data residency.

## Suggested stack
Python 3.11, FastAPI, Postgres + PostGIS, Redis, pytest

## Starter files
- `geo.py`
- `tests/test_geo.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 16-proximity-service
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
