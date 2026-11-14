import pytest
from cicd import ResolutionError, bump, cache_key, compare, parse, resolve, satisfies


def test_parse_compare():
    assert parse("1.2.3-rc.1") == (1, 2, 3, ("rc", 1))
    order = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-beta", "1.0.0-rc.1", "1.0.0", "1.0.1", "1.10.0", "2.0.0"]
    for a, b in zip(order, order[1:]):
        assert compare(a, b) == -1 and compare(b, a) == 1
    assert compare("1.0.0", "1.0.0") == 0


def test_bump():
    assert bump("1.2.3", "patch") == "1.2.4"
    assert bump("1.2.3", "minor") == "1.3.0"
    assert bump("1.2.3-rc.1", "major") == "2.0.0"


def test_ranges():
    assert satisfies("1.9.0", "^1.2.3") and not satisfies("2.0.0", "^1.2.3")
    assert satisfies("1.2.9", "~1.2.3") and not satisfies("1.3.0", "~1.2.3")
    assert satisfies("0.2.9", "^0.2.3") and not satisfies("0.3.0", "^0.2.3")
    assert satisfies("1.5.0", ">=1.0.0 <2.0.0") and not satisfies("2.0.0", ">=1.0.0 <2.0.0")
    assert not satisfies("1.3.0-rc.1", "^1.2.3")


REG = {
    "web": {"1.0.0": {"http": "^1.0.0"}, "2.0.0": {"http": "^2.0.0"}},
    "auth": {"1.0.0": {"http": "^1.2.0"}},
    "http": {"1.1.0": {}, "1.3.0": {}, "2.0.0": {}},
}


def test_resolve_backtracks():
    # web 2.0.0 needs http 2 but auth needs http 1 -> must fall back to web 1.0.0
    assert resolve({"web": "*", "auth": "^1.0.0"}, REG) == {"web": "1.0.0", "auth": "1.0.0", "http": "1.3.0"}


def test_dependency_hell():
    with pytest.raises(ResolutionError):
        resolve({"web": "^2.0.0", "auth": "^1.0.0"}, REG)


def test_cache_key_stable():
    a = cache_key("test", {"a.py": "x", "b.py": "y"}, {"PY": "3.11"})
    b = cache_key("test", {"b.py": "y", "a.py": "x"}, {"PY": "3.11"})
    assert a == b and len(a) == 64
    assert a != cache_key("test", {"a.py": "x", "b.py": "z"}, {"PY": "3.11"})
    assert a != cache_key("test", {"a.py": "x", "b.py": "y"}, {"PY": "3.12"})
