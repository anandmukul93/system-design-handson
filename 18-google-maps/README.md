# 18 · Google Maps

> Phase 3: Geo and real-time location · Suggested time: 1-2 weeks · Notes: [Google Maps](https://github.com/liquidslr/system-design-notes/tree/main/18.%20Google%20Maps) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=18-google-maps)

**Concepts covered:** Foundations for the rest of the course

## Goal
Build the three pillars of a maps product at city scale: a tile server, a routing service on a real road graph with A*, and a location ingestion pipeline that feeds live traffic into ETAs.

## 1. Concepts
### Map tiles
The world is rendered into square tiles per zoom level (z/x/y) and served statically from a CDN.

### Routing graph
Roads become a weighted graph; Dijkstra finds shortest paths and A* uses a distance heuristic to explore far fewer nodes.

### Routing tiles
Split the graph into tiles loaded on demand, with hierarchical levels for long routes.

### Live traffic and ETA
Driver location pings feed a stream that updates edge weights; ETAs and reroutes use the live weights.

## 2. Trade-offs and optimizations
- A* is only as good as its heuristic (must never overestimate).
- Precomputation (contraction hierarchies) speeds queries but slows updates.
- Location ingestion is write-heavy: batch and stream it.

## 3. Demo
A road grid you can draw walls on: run Dijkstra and A* side by side and watch their frontiers expand, compare nodes explored, then add traffic to some roads and see the route and ETA change.

- **In the browser:** [18-google-maps on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=18-google-maps). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=18-google-maps>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Routing tiles: load an OpenStreetMap extract (one city, via osmnx), split the road graph into geohash-keyed tiles and load tiles lazily during search.
- Shortest path with Dijkstra and A* (haversine heuristic); compare nodes expanded.
- ETA service that adjusts edge weights from live traffic aggregated from simulated driver location pings (Kafka/Redpanda stream).
- Map tile serving: pre-rendered raster tiles (z/x/y) from a static folder behind nginx with caching (or vector tiles via tippecanoe).
- Navigation API that returns route + ETA and re-routes when traffic changes.

### Milestones
- [ ] Make `pytest 18-google-maps` pass (Dijkstra + A* on a small graph).
- [ ] Load a city graph from OSM and route between two addresses; compare A* vs Dijkstra expansions.
- [ ] Split into routing tiles and load them on demand; measure memory.
- [ ] Stream simulated traffic, update edge weights and show a route change.

### Starter files
- [`routing.py`](routing.py)
- [`tests/test_routing.py`](tests/test_routing.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 18-google-maps
```

### Stretch goals
- [ ] Contraction hierarchies for long-distance routes.
- [ ] Turn restrictions and one-way streets.
- [ ] Offline maps: download tiles for a bounding box.

### Suggested stack
Python 3.11, osmnx + networkx (for loading only), Redpanda, FastAPI, nginx, pytest

## 5. Break it
- [ ] Use an overestimating heuristic and get a wrong route.
- [ ] Route across tile boundaries with lazy loading.
- [ ] Flood the ingestion stream and watch lag.

## 6. Review
- Why does A* explore fewer nodes than Dijkstra?
- What are routing tiles?
- How does live traffic change ETAs?
- Why are map tiles static?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/18.%20Google%20Maps).

## Results
_Write your measurements, failure experiments and surprises here._
