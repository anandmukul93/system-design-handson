from partition_log import OffsetStore, PartitionLog, assign_round_robin


def test_append_read(tmp_path):
    log = PartitionLog(str(tmp_path))
    assert log.append(b"a") == 0
    assert log.append_batch([b"b", b"c"]) == [1, 2]
    assert log.read(1) == [(1, b"b"), (2, b"c")]
    assert log.read(3) == []
    assert log.end_offset() == 3


def test_segment_roll_and_reads_across_segments(tmp_path):
    log = PartitionLog(str(tmp_path), segment_bytes=100)
    for i in range(50):
        log.append(f"msg-{i:03d}".encode())
    assert log.segment_count() > 3
    got = log.read(10, max_records=30)
    assert [o for o, _ in got] == list(range(10, 40))
    assert got[0][1] == b"msg-010"


def test_recovery(tmp_path):
    log = PartitionLog(str(tmp_path), segment_bytes=64)
    for i in range(20):
        log.append(b"x" * 10)
    reopened = PartitionLog(str(tmp_path), segment_bytes=64)
    assert reopened.end_offset() == 20
    assert reopened.append(b"y") == 20


def test_offsets_and_assignment():
    s = OffsetStore()
    assert s.fetch("g", 0) == 0
    s.commit("g", 0, 42)
    assert s.fetch("g", 0) == 42
    assert assign_round_robin([0, 1, 2, 3, 4], ["c2", "c1"]) == {"c1": [0, 2, 4], "c2": [1, 3]}
