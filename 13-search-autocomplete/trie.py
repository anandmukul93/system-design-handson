"""Trie with top-k cached at each node."""


class Node:
    __slots__ = ("children", "top", "count")

    def __init__(self):
        self.children: dict[str, "Node"] = {}
        self.top: list[tuple[int, str]] = []   # cached (freq, query), best first
        self.count = 0                          # >0 if a query ends here


class Trie:
    def __init__(self, k: int = 5):
        self.k = k
        self.root = Node()

    def insert(self, query: str, freq: int) -> None:
        """Insert/overwrite query with freq and update the top-k cache on every node along the path.
        Ties: higher freq first, then alphabetical."""
        raise NotImplementedError

    def suggest(self, prefix: str) -> list[str]:
        """Return up to k queries for prefix, best first. [] if prefix unknown."""
        raise NotImplementedError

    @classmethod
    def build(cls, freqs: dict[str, int], k: int = 5) -> "Trie":
        t = cls(k)
        for q, f in freqs.items():
            t.insert(q, f)
        return t
