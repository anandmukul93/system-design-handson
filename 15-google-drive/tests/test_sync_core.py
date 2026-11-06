import os

import pytest
from sync_core import ConflictError, MetadataStore, blocks_to_upload, chunk


def test_chunk_and_delta():
    data = bytearray(os.urandom(10 * 1024))
    before = chunk(bytes(data), block_size=1024)
    assert len(before) == 10
    data[5000] ^= 0xFF
    after = chunk(bytes(data), block_size=1024)
    assert blocks_to_upload(after, set(before)) == [after[4]]


def test_dedupe_identical_blocks():
    data = b"a" * 4096
    hashes = chunk(data, block_size=1024)
    assert len(set(hashes)) == 1
    assert blocks_to_upload(hashes, set()) == [hashes[0]]


def test_optimistic_concurrency():
    m = MetadataStore()
    v1 = m.commit("/a.txt", 0, ["h1"])
    v2 = m.commit("/a.txt", v1, ["h2"])
    assert v2 == v1 + 1
    with pytest.raises(ConflictError):
        m.commit("/a.txt", v1, ["h3"])  # stale edit from another device
    assert m.history["/a.txt"] == [["h1"], ["h2"]]
