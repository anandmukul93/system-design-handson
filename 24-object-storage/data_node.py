"""Packs objects into append-only data files.

Each object stored as: payload bytes; the mapping keeps (file_name, offset, size, crc32).
When the active file would exceed max_file_bytes, seal it and open a new one.
read() must verify the crc32 and raise CorruptionError on mismatch."""
import uuid
import zlib
from pathlib import Path


class CorruptionError(Exception):
    pass


class DataNode:
    def __init__(self, directory: str, max_file_bytes: int = 64 * 1024 * 1024):
        self.dir = Path(directory)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.max_file_bytes = max_file_bytes
        self.mapping: dict[str, tuple[str, int, int, int]] = {}  # object_id -> (file, offset, size, crc)
        self.deleted: set[str] = set()

    def put(self, data: bytes) -> str:
        """Store and return a new object_id (uuid4 hex)."""
        raise NotImplementedError

    def get(self, object_id: str) -> bytes:
        raise NotImplementedError

    def delete(self, object_id: str) -> None:
        """Mark deleted; space is reclaimed by compact()."""
        raise NotImplementedError

    def file_count(self) -> int:
        raise NotImplementedError

    def compact(self) -> int:
        """Rewrite live objects of all SEALED files into new files, delete old files.
        Return bytes reclaimed."""
        raise NotImplementedError
