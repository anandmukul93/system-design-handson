# 13 · Design a Search Autocomplete System

> Notes: [Design a Search Autocomplete System](https://github.com/liquidslr/system-design-notes/tree/main/13.%20Search%20Autocomplete) · Phase 2: Classic product systems · Suggested time: 4-5 days

## Goal
Build a typeahead service: a trie with cached top-k at every node, rebuilt offline from a query log, served fast from memory.

## What you'll build
- Trie where each node caches the top-k completions, so lookup is O(prefix length).
- Offline pipeline: raw query logs -> aggregated (query, frequency) per week -> trie build -> serialized snapshot.
- FastAPI `/autocomplete?q=` with a browser cache header and a small HTML page that calls it on every keystroke (debounced).
- Sharding by prefix with a shard map that balances uneven letter distributions.

## Key concepts exercised
- Trie with top-k caching
- Data gathering vs query service
- Offline rebuild vs real-time updates
- Browser caching, AJAX
- Sharding by first character with a shard map

## Milestones
- [ ] Make `pytest 13-search-autocomplete` pass.
- [ ] Download a public query/word-frequency list and build the trie offline; measure build time and memory.
- [ ] Serve it and measure p99 for 10k random prefixes.
- [ ] Implement the shard map and route prefixes to 3 trie servers.

## Stretch goals
- [ ] Trending: blend in a short-window counter for real-time queries.
- [ ] Filter layer for unwanted suggestions.
- [ ] Fuzzy matching (edit distance 1) and multi-language support.

## Suggested stack
Python 3.11, FastAPI, pytest

## Starter files
- `tests/test_trie.py`
- `trie.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 13-search-autocomplete
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
