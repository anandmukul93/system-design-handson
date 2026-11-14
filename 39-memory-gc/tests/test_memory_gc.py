from memory_gc import Heap, growing_types


def build():
    h = Heap()
    h.alloc("root", root=True)
    for n in ["a", "b", "c", "d"]:
        h.alloc(n)
    h.link("root", "a"); h.link("a", "b")
    h.link("c", "d"); h.link("d", "c")          # an unreachable cycle
    return h


def test_refcount_misses_cycles():
    h = build()
    assert h.refcount_collect() == set()
    assert {"c", "d"} <= h.objects


def test_mark_sweep_frees_cycles():
    h = build()
    assert h.mark_sweep() == {"c", "d"}
    assert h.objects == {"root", "a", "b"}


def test_cascade():
    h = build()
    h.unlink("root", "a")
    assert h.refcount_collect() == {"a", "b"}


def test_growing_types():
    snaps = [{"dict": 100, "Request": 10, "str": 500},
             {"dict": 90, "Request": 20, "str": 510},
             {"dict": 105, "Request": 35, "str": 520}]
    assert growing_types(snaps) == ["Request", "str"]
    assert growing_types(snaps, min_growth=25) == ["Request"]
