from bloom import BloomFilter
from lsm import LSMStore
from vector_clock import VectorClock


def test_vector_clock_ordering():
    a = VectorClock().increment("x")
    b = a.increment("x")
    assert b.descends_from(a) and not a.descends_from(b)
    assert not a.conflicts_with(b)


def test_vector_clock_conflict_and_merge():
    base = VectorClock().increment("x")
    left, right = base.increment("y"), base.increment("z")
    assert left.conflicts_with(right)
    merged = left.merge(right).increment("x")
    assert merged.descends_from(left) and merged.descends_from(right)


def test_bloom_no_false_negatives():
    bf = BloomFilter(1000, 0.01)
    for i in range(1000):
        bf.add(f"k{i}")
    assert all(bf.might_contain(f"k{i}") for i in range(1000))
    fps = sum(bf.might_contain(f"other{i}") for i in range(10_000))
    assert fps < 300


def test_lsm_put_get_flush(tmp_path):
    db = LSMStore(str(tmp_path), memtable_limit=10)
    for i in range(35):
        db.put(f"k{i}", f"v{i}")
    assert db.sstable_count() >= 3
    assert db.get("k0") == "v0" and db.get("k34") == "v34"
    assert db.get("missing") is None


def test_lsm_overwrite_and_delete(tmp_path):
    db = LSMStore(str(tmp_path), memtable_limit=2)
    db.put("a", "1"); db.put("b", "x")       # flushed
    db.put("a", "2"); db.put("c", "x")       # flushed
    assert db.get("a") == "2"
    db.delete("a"); db.flush()
    assert db.get("a") is None
    db.compact()
    assert db.sstable_count() == 1
    assert db.get("a") is None and db.get("b") == "x"
