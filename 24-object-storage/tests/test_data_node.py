import pytest
from data_node import CorruptionError, DataNode


def test_put_get_and_packing(tmp_path):
    n = DataNode(str(tmp_path), max_file_bytes=1000)
    ids = [n.put(bytes([i]) * 100) for i in range(25)]
    assert n.file_count() >= 3
    assert n.get(ids[7]) == bytes([7]) * 100


def test_corruption_detected(tmp_path):
    n = DataNode(str(tmp_path))
    oid = n.put(b"hello world")
    fname, offset, size, _ = n.mapping[oid]
    p = tmp_path / fname
    raw = bytearray(p.read_bytes()); raw[offset] ^= 0xFF; p.write_bytes(bytes(raw))
    with pytest.raises(CorruptionError):
        n.get(oid)


def test_delete_and_compact(tmp_path):
    n = DataNode(str(tmp_path), max_file_bytes=500)
    ids = [n.put(b"x" * 100) for i in range(20)]
    for oid in ids[:10]:
        n.delete(oid)
    reclaimed = n.compact()
    assert reclaimed >= 800
    assert all(n.get(oid) == b"x" * 100 for oid in ids[10:])
    with pytest.raises(KeyError):
        n.get(ids[0])
