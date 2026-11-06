from trie import Trie

DATA = {"tree": 10, "true": 35, "try": 29, "toy": 14, "wish": 25, "win": 50, "twitch": 6, "twitter": 20}


def test_suggest_top_k():
    t = Trie.build(DATA, k=3)
    assert t.suggest("t") == ["true", "try", "twitter"]
    assert t.suggest("tr") == ["true", "try", "tree"]
    assert t.suggest("w") == ["win", "wish"]
    assert t.suggest("x") == []


def test_update_freq():
    t = Trie.build(DATA, k=2)
    t.insert("toy", 100)
    assert t.suggest("t") == ["toy", "true"]


def test_ties_alphabetical():
    t = Trie.build({"ab": 1, "aa": 1, "ac": 1}, k=2)
    assert t.suggest("a") == ["aa", "ab"]
