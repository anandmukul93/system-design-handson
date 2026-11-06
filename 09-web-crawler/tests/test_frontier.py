from frontier import Frontier, normalize


def test_normalize():
    assert normalize("HTTP://Example.COM:80/a#frag") == "http://example.com/a"
    assert normalize("https://example.com:443") == "https://example.com/"
    assert normalize("https://example.com:8443/x?q=1") == "https://example.com:8443/x?q=1"


def test_dedupe():
    f = Frontier()
    assert f.add("http://a.com/x")
    assert not f.add("http://A.com/x#y")
    assert len(f) == 1


def test_politeness_per_host():
    f = Frontier(delay=1.0)
    for i in range(3):
        f.add(f"http://a.com/{i}")
    f.add("http://b.com/0")
    got = [f.next_url(0.0), f.next_url(0.0), f.next_url(0.0)]
    hosts = [u.split("/")[2] for u in got if u]
    assert sorted(hosts) == ["a.com", "b.com"]   # third call: a.com not ready yet
    assert got[2] is None
    assert f.next_url(1.0).startswith("http://a.com/")


def test_priority():
    f = Frontier(delay=0)
    f.add("http://low.com/", priority=9)
    f.add("http://high.com/", priority=1)
    assert f.next_url(0.0) == "http://high.com/"
