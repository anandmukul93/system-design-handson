# 13 · Design a Search Autocomplete System

> Phase 2: Classic product systems · Suggested time: 4-5 days · Notes: [Design a Search Autocomplete System](https://github.com/liquidslr/system-design-notes/tree/main/13.%20Search%20Autocomplete) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=13-search-autocomplete)

**Concepts covered:** Foundations for the rest of the course

## Goal
Build a typeahead service: a trie with cached top-k at every node, rebuilt offline from a query log, served fast from memory.

## 1. Concepts
### Trie
A prefix tree where each node is a character; all queries with a prefix live under its node.

### Top-k caching
Store the best k completions at every node so a lookup is just walking the prefix: O(prefix length).

### Data gathering
Aggregate query logs offline (weekly or daily) and rebuild the trie; serving never blocks on writes.

### Sharding
Split by prefix ranges with a shard map balanced on real traffic, not by first letter evenly.

## 2. Trade-offs and optimizations
- Caching top-k at every node trades memory for speed.
- Offline rebuilds are simple but can't show trending queries immediately.
- Browser caching and debouncing cut requests dramatically.

## 3. Demo
Type into a search box backed by a trie built from sample queries. The trie draws itself, highlights the path for your prefix and shows the cached top-k at each node; add query frequency and watch suggestions reorder.

- **In the browser:** [13-search-autocomplete on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=13-search-autocomplete). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=13-search-autocomplete>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Trie where each node caches the top-k completions, so lookup is O(prefix length).
- Offline pipeline: raw query logs -> aggregated (query, frequency) per week -> trie build -> serialized snapshot.
- FastAPI `/autocomplete?q=` with a browser cache header and a small HTML page that calls it on every keystroke (debounced).
- Sharding by prefix with a shard map that balances uneven letter distributions.

### Milestones
- [ ] Make `pytest 13-search-autocomplete` pass.
- [ ] Download a public query/word-frequency list and build the trie offline; measure build time and memory.
- [ ] Serve it and measure p99 for 10k random prefixes.
- [ ] Implement the shard map and route prefixes to 3 trie servers.

### Starter files
- [`tests/test_trie.py`](tests/test_trie.py)
- [`trie.py`](trie.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 13-search-autocomplete
```

### Stretch goals
- [ ] Trending: blend in a short-window counter for real-time queries.
- [ ] Filter layer for unwanted suggestions.
- [ ] Fuzzy matching (edit distance 1) and multi-language support.

### Suggested stack
Python 3.11, FastAPI, pytest

## 5. Break it
- [ ] Disable top-k caching and traverse the subtree on every keystroke.
- [ ] Skew traffic to one letter and look at shard load.
- [ ] Insert an offensive query and design the filter layer.

## 6. Review
- Why cache top-k at every node?
- How often would you rebuild the trie and why?
- How do you shard a trie?
- How do you support trending queries?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/13.%20Search%20Autocomplete).

## Results
_Write your measurements, failure experiments and surprises here._
