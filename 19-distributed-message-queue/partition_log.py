"""Append-only partition log made of segment files.

Each record: 4-byte big-endian length + payload. Segment file name = base offset
zero-padded to 20 digits + ".log". Roll a new segment when the active one reaches
`segment_bytes`. Offsets are global for the partition and start at 0."""
from pathlib import Path


class PartitionLog:
    def __init__(self, directory: str, segment_bytes: int = 1 << 20):
        self.dir = Path(directory)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.segment_bytes = segment_bytes
        # TODO: on startup, rebuild state from existing segment files (crash recovery)

    def append(self, payload: bytes) -> int:
        """Append and return the record's offset."""
        raise NotImplementedError

    def append_batch(self, payloads: list[bytes]) -> list[int]:
        raise NotImplementedError

    def read(self, offset: int, max_records: int = 100) -> list[tuple[int, bytes]]:
        """Records starting at offset as [(offset, payload)]. [] if offset >= end."""
        raise NotImplementedError

    def end_offset(self) -> int:
        raise NotImplementedError

    def segment_count(self) -> int:
        raise NotImplementedError


class OffsetStore:
    """Committed offsets per (group, partition). The committed offset is the NEXT offset to read."""

    def __init__(self):
        self.offsets: dict[tuple[str, int], int] = {}

    def commit(self, group: str, partition: int, offset: int) -> None:
        raise NotImplementedError

    def fetch(self, group: str, partition: int) -> int:
        """0 if never committed."""
        raise NotImplementedError


def assign_round_robin(partitions: list[int], members: list[str]) -> dict[str, list[int]]:
    """Sort members; give partition i to members[i % len(members)]."""
    raise NotImplementedError
