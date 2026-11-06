# 18 · Google Maps

> Notes: [Google Maps](https://github.com/liquidslr/system-design-notes/tree/main/18.%20Google%20Maps) · Phase 3: Geo and real-time location · Suggested time: 1-2 weeks

## Goal
Build the three pillars of a maps product at city scale: a tile server, a routing service on a real road graph with A*, and a location ingestion pipeline that feeds live traffic into ETAs.

## What you'll build
- Routing tiles: load an OpenStreetMap extract (one city, via osmnx), split the road graph into geohash-keyed tiles and load tiles lazily during search.
- Shortest path with Dijkstra and A* (haversine heuristic); compare nodes expanded.
- ETA service that adjusts edge weights from live traffic aggregated from simulated driver location pings (Kafka/Redpanda stream).
- Map tile serving: pre-rendered raster tiles (z/x/y) from a static folder behind nginx with caching (or vector tiles via tippecanoe).
- Navigation API that returns route + ETA and re-routes when traffic changes.

## Key concepts exercised
- Map projection and tiles (z/x/y)
- Routing tiles and hierarchical routing
- Dijkstra vs A*
- Location ingestion at high write QPS
- ETA from live traffic
- CDN for static tiles

## Milestones
- [ ] Make `pytest 18-google-maps` pass (Dijkstra + A* on a small graph).
- [ ] Load a city graph from OSM and route between two addresses; compare A* vs Dijkstra expansions.
- [ ] Split into routing tiles and load them on demand; measure memory.
- [ ] Stream simulated traffic, update edge weights and show a route change.

## Stretch goals
- [ ] Contraction hierarchies for long-distance routes.
- [ ] Turn restrictions and one-way streets.
- [ ] Offline maps: download tiles for a bounding box.

## Suggested stack
Python 3.11, osmnx + networkx (for loading only), Redpanda, FastAPI, nginx, pytest

## Starter files
- `routing.py`
- `tests/test_routing.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 18-google-maps
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
