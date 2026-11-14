class Heap:
    """Objects are names. refs[a] = set of objects a points to. roots are always alive."""

    def __init__(self):
        self.objects: set[str] = set()
        self.refs: dict[str, set[str]] = {}
        self.roots: set[str] = set()

    def alloc(self, name: str, root: bool = False) -> None:
        self.objects.add(name)
        self.refs[name] = set()
        if root:
            self.roots.add(name)

    def link(self, a: str, b: str) -> None:
        self.refs[a].add(b)

    def unlink(self, a: str, b: str) -> None:
        self.refs[a].discard(b)

    def drop_root(self, name: str) -> None:
        self.roots.discard(name)

    def refcount_collect(self) -> set[str]:
        """Reference counting: repeatedly free non-root objects with zero incoming refs
        (from live objects), cascading. Remove and return the freed set."""
        raise NotImplementedError

    def mark_sweep(self) -> set[str]:
        """Mark everything reachable from roots, free the rest. Remove and return the freed set."""
        raise NotImplementedError


def growing_types(snapshots: list[dict[str, int]], min_growth: int = 1) -> list[str]:
    """Types whose count strictly increases between EVERY consecutive snapshot and grows by at least
    min_growth overall. Sorted by total growth, largest first."""
    raise NotImplementedError
