import hashlib

BLOCK_SIZE = 4 * 1024 * 1024


def chunk(data: bytes, block_size: int = BLOCK_SIZE) -> list[str]:
    """Split into fixed-size blocks and return the list of sha256 hex digests."""
    raise NotImplementedError


def blocks_to_upload(local: list[str], server_has: set[str]) -> list[str]:
    """Hashes in `local` that the server doesn't have, deduped, in first-seen order."""
    raise NotImplementedError


class ConflictError(Exception):
    pass


class MetadataStore:
    """file path -> (version, block list). Optimistic concurrency on version."""

    def __init__(self):
        self.files: dict[str, tuple[int, list[str]]] = {}
        self.history: dict[str, list[list[str]]] = {}

    def commit(self, path: str, base_version: int, blocks: list[str]) -> int:
        """base_version is the version the client edited (0 for new files).
        If it isn't the current version, raise ConflictError.
        Otherwise store, append to history, and return the new version."""
        raise NotImplementedError
