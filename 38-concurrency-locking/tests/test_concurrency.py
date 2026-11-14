import threading

import pytest
from concurrency import Account, FencedStore, LeaseLock, SafeCounter, find_deadlock, transfer


@pytest.mark.needs_threads
def test_counter_is_thread_safe():
    c = SafeCounter()
    c.increment()          # fails fast with NotImplementedError until you implement it
    ts = [threading.Thread(target=lambda: [c.increment() for _ in range(20_000)]) for _ in range(8)]
    [t.start() for t in ts]; [t.join() for t in ts]
    assert c.value == 160_001


@pytest.mark.needs_threads
def test_transfers_no_deadlock_and_conserved():
    a, b = Account(1, 1000), Account(2, 1000)
    assert transfer(a, b, 1) and transfer(b, a, 1)   # fails fast until implemented
    def worker(x, y):
        for _ in range(2000):
            transfer(x, y, 1)
    ts = [threading.Thread(target=worker, args=(a, b)), threading.Thread(target=worker, args=(b, a))]
    [t.start() for t in ts]; [t.join(timeout=10) for t in ts]
    assert not any(t.is_alive() for t in ts)
    assert a.balance + b.balance == 2000


def test_insufficient_funds():
    a, b = Account(1, 5), Account(2, 0)
    assert not transfer(a, b, 10) and (a.balance, b.balance) == (5, 0)
    assert transfer(a, b, 5) and (a.balance, b.balance) == (0, 5)


def test_find_deadlock():
    assert find_deadlock({"t1": {"t2"}, "t2": {"t3"}, "t3": set()}) is None
    assert find_deadlock({"c": {"a"}, "a": {"b"}, "b": {"c"}, "d": {"a"}}) == ["a", "b", "c"]


def test_lease_and_fencing():
    lock, store = LeaseLock(), FencedStore()
    t1 = lock.acquire("job", "w1", now=0, ttl=10)
    assert lock.acquire("job", "w2", now=5, ttl=10) is None
    assert lock.acquire("job", "w1", now=5, ttl=10) == t1          # renew
    t2 = lock.acquire("job", "w2", now=16, ttl=10)                 # w1's lease expired (GC pause)
    assert t2 > t1
    assert store.write(t2, "from w2")
    assert not store.write(t1, "late write from paused w1")
    assert store.value == "from w2"
    lock.release("job", "w2")
    assert lock.acquire("job", "w3", now=17, ttl=10) > t2
