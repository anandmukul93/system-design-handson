"""Single-node LSM engine.

put/delete go to the memtable (dict). When it holds >= memtable_limit keys,
flush it to an immutable sorted SSTable file in `data_dir` (one JSON line per
key, sorted). get() checks memtable, then SSTables newest -> oldest.
Deletes write a tombstone so older SSTables don't resurrect the key."""
from pathlib import Path

TOMBSTONE = "__tombstone__"


class LSMStore:
    def __init__(self, data_dir: str, memtable_limit: int = 1000):
        self.dir = Path(data_dir)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.memtable_limit = memtable_limit
        self.memtable: dict[str, str] = {}

    def put(self, key: str, value: str) -> None:
        raise NotImplementedError

    def delete(self, key: str) -> None:
        raise NotImplementedError

    def get(self, key: str) -> str | None:
        raise NotImplementedError

    def flush(self) -> None:
        raise NotImplementedError

    def sstable_count(self) -> int:
        raise NotImplementedError

    def compact(self) -> None:
        """Merge all SSTables into one, keeping newest value and dropping tombstones."""
        raise NotImplementedError
