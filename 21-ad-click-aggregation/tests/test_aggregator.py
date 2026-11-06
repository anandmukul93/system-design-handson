from aggregator import WindowAggregator


def ev(cid, ad, ts):
    return {"click_id": cid, "ad_id": ad, "ts": ts}


def test_window_closes_on_watermark():
    a = WindowAggregator(window=60, allowed_lateness=10, top_n=2)
    out = []
    for i, (ad, ts) in enumerate([("x", 1), ("y", 5), ("x", 30), ("z", 59)]):
        out += a.add(ev(i, ad, ts))
    assert out == []
    out += a.add(ev(10, "x", 65))   # watermark 55 -> nothing closes
    assert out == []
    out += a.add(ev(11, "x", 71))   # watermark 61 -> window 0 closes
    assert out == [{"window_start": 0, "counts": {"x": 2, "y": 1, "z": 1}, "top": ["x", "y"]}]


def test_dedupe_and_late():
    a = WindowAggregator(window=60, allowed_lateness=0)
    a.add(ev("c1", "x", 10))
    a.add(ev("c1", "x", 10))       # duplicate
    out = a.add(ev("c2", "y", 120))  # closes window 0 and 60
    assert out[0]["counts"] == {"x": 1}
    a.add(ev("c3", "x", 20))       # late for closed window 0
    assert [e["click_id"] for e in a.late] == ["c3"]
