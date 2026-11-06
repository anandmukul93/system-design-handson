import random

from order_book import OrderBook


def test_no_cross_rests():
    b = OrderBook()
    assert b.add("b1", "buy", 100, 10) == []
    assert b.add("s1", "sell", 101, 5) == []
    assert (b.best_bid(), b.best_ask()) == (100, 101)


def test_price_time_priority_and_partial_fill():
    b = OrderBook()
    b.add("s1", "sell", 101, 5)
    b.add("s2", "sell", 100, 3)
    b.add("s3", "sell", 100, 4)
    fills = b.add("b1", "buy", 101, 10)
    assert fills == [
        {"taker": "b1", "maker": "s2", "price": 100, "qty": 3},
        {"taker": "b1", "maker": "s3", "price": 100, "qty": 4},
        {"taker": "b1", "maker": "s1", "price": 101, "qty": 3},
    ]
    assert b.depth() == {"bids": [], "asks": [(101, 2)]}


def test_remainder_rests_and_cancel():
    b = OrderBook()
    b.add("s1", "sell", 100, 2)
    b.add("b1", "buy", 100, 5)
    assert b.depth() == {"bids": [(100, 3)], "asks": []}
    assert b.cancel("b1") and not b.cancel("b1")
    assert b.best_bid() is None


def test_deterministic_replay():
    rng = random.Random(42)
    log = [(f"o{i}", rng.choice(["buy", "sell"]), rng.randint(95, 105), rng.randint(1, 20)) for i in range(3000)]
    a, c = OrderBook(), OrderBook()
    fa = [f for o in log for f in a.add(*o)]
    fc = [f for o in log for f in c.add(*o)]
    assert fa == fc and a.depth(20) == c.depth(20)
    bb, ba = a.best_bid(), a.best_ask()
    assert bb is None or ba is None or bb < ba   # book never crossed
