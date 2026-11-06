import random

import pytest
from wallet import InsufficientFunds, Wallet


def test_deposit_transfer_and_conservation():
    w = Wallet()
    w.deposit("r1", "a", 100)
    w.transfer("r2", "a", "b", 30)
    assert w.balances == {"a": 70, "b": 30}
    with pytest.raises(InsufficientFunds):
        w.transfer("r3", "b", "a", 31)
    assert w.total() == 100


def test_idempotent_requests():
    w = Wallet()
    w.deposit("r1", "a", 100)
    w.transfer("r2", "a", "b", 30)
    w.transfer("r2", "a", "b", 30)
    assert w.balances["b"] == 30


def test_replay_equals_live_state():
    rng = random.Random(7)
    w = Wallet()
    for i in range(10):
        w.deposit(f"d{i}", f"acc{i}", 1000)
    for i in range(2000):
        try:
            w.transfer(f"t{i}", f"acc{rng.randrange(10)}", f"acc{rng.randrange(10)}", rng.randrange(1, 300))
        except InsufficientFunds:
            pass
    assert w.total() == 10_000
    assert Wallet.replay(w.events).balances == w.balances
    snap = Wallet.replay(w.events[:500]).snapshot()
    assert Wallet.replay(w.events, snapshot=snap).balances == w.balances
