import base62
from shortener import Shortener


def test_base62_known_values():
    assert base62.encode(0) == "0"
    assert base62.encode(61) == "Z"
    assert base62.encode(62) == "10"
    assert base62.encode(11157) == "2TX"


def test_base62_roundtrip():
    for n in [1, 999, 2**40, 3_521_614_606_207]:
        assert base62.decode(base62.encode(n)) == n
    assert len(base62.encode(62**7 - 1)) == 7


def test_shorten_idempotent_and_resolve():
    ids = iter(range(1000, 2000))
    s = Shortener(lambda: next(ids))
    a = s.shorten("https://example.com/a")
    assert s.shorten("https://example.com/a") == a
    b = s.shorten("https://example.com/b")
    assert a != b
    assert s.resolve(a) == "https://example.com/a"
    assert s.resolve("nope") is None
