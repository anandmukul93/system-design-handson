# 16 · Proximity Service

> Phase 3: Geo and real-time location · Suggested time: 1 week · Notes: [Proximity Service](https://github.com/liquidslr/system-design-notes/tree/main/16.%20Proximity%20Service) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=16-proximity-service)

**Concepts covered:** #25 Database Indexing

## Goal
Build a Yelp-style "businesses near me" service and implement geohash and quadtree indexes yourself, then compare them with PostGIS.

## 1. Concepts
### Geospatial indexing
Plain lat/lng range indexes can't answer 'near me' efficiently, so space is divided into cells.

### Geohash
Interleave longitude and latitude bits into a base32 string: shared prefixes mean nearby cells. Search the cell and its 8 neighbours to handle boundaries.

### Quadtree
Recursively split regions with too many points into four, adapting to density; good for k-nearest queries.

### Caching and replicas
Location data is read-heavy and changes slowly: cache cell -> business ids and scale reads with replicas.

## 2. Trade-offs and optimizations
- Geohash is easy to store in any DB; quadtrees adapt better but live in memory.
- Cell size must match the search radius.
- Business updates can be batched nightly.

## 3. Demo
A map grid: click to search near a point, switch between geohash cells (with neighbours) and a quadtree, adjust precision and radius, and watch which cells or quads are scanned and which businesses match.

- **In the browser:** [16-proximity-service on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=16-proximity-service). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`geohash_index.js`](demo/geohash_index.js), [`quadtree_index.js`](demo/quadtree_index.js), [`search.js`](demo/search.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=16-proximity-service>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Business CRUD service (Postgres) and a read-only Location Based Service (LBS).
- Geohash encode/decode + neighbor cells; search radius picks precision and queries 9 cells.
- An in-memory quadtree built at startup, with k-nearest search.
- Load 1M synthetic (or OpenStreetMap POI) businesses and benchmark: naive lat/lng range scan vs geohash vs quadtree vs PostGIS GiST.
- Redis cache: geohash -> business IDs, business ID -> object.

### Milestones
- [ ] Make `pytest 16-proximity-service` pass (geohash + haversine).
- [ ] Implement neighbors() and radius search; test points across a cell boundary.
- [ ] Build the quadtree and k-NN; benchmark against geohash on 1M points.
- [ ] Compare with PostGIS `ST_DWithin` and write up the trade-offs.

### Starter files
- [`geo.py`](geo.py)
- [`tests/test_geo.py`](tests/test_geo.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 16-proximity-service
```

### Stretch goals
- [ ] Google S2 cells via the s2sphere library.
- [ ] Business updates propagate to the index nightly vs in real time.
- [ ] Multi-region deployment with data residency.

### Suggested stack
Python 3.11, FastAPI, Postgres + PostGIS, Redis, pytest

## 5. Break it
- [ ] Search at a cell boundary without neighbours.
- [ ] Cluster all businesses in one spot and inspect the quadtree.
- [ ] Use too fine a geohash precision for a large radius.

## 6. Review
- Why search the 8 neighbouring geohash cells?
- Geohash vs quadtree: when each?
- How do you pick geohash precision?
- What do you cache?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/16.%20Proximity%20Service).

## Results
_Write your measurements, failure experiments and surprises here._
