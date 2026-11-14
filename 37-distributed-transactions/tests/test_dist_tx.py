import pytest
from dist_tx import IdempotencyConflict, IdempotencyStore, Outbox, Saga, TwoPhaseCommit


class P:
    def __init__(self, name, vote=True, log=None):
        self.name, self.vote, self.log = name, vote, log

    def prepare(self):
        self.log.append(f"prepare {self.name}")
        if self.vote == "raise":
            raise RuntimeError
        return self.vote

    def commit(self):
        self.log.append(f"commit {self.name}")

    def abort(self):
        self.log.append(f"abort {self.name}")


def test_2pc_commit_and_abort():
    log = []
    assert TwoPhaseCommit().run([P("a", log=log), P("b", log=log)]) == "committed"
    assert log == ["prepare a", "prepare b", "commit a", "commit b"]
    log.clear()
    assert TwoPhaseCommit().run([P("a", log=log), P("b", False, log), P("c", log=log)]) == "aborted"
    assert "prepare c" not in log and {"abort a", "abort b", "abort c"} <= set(log)


def test_saga_compensates_in_reverse():
    log = []
    def boom():
        raise RuntimeError("no cars")
    s = (Saga().step("flight", lambda: log.append("book flight"), lambda: log.append("cancel flight"))
               .step("hotel", lambda: log.append("book hotel"), lambda: log.append("cancel hotel"))
               .step("car", boom, lambda: log.append("cancel car")))
    assert s.run() == {"status": "compensated", "failed": "car", "compensated": ["hotel", "flight"]}
    assert log == ["book flight", "book hotel", "cancel hotel", "cancel flight"]


def test_outbox_at_least_once():
    ob = Outbox()
    for i in (1, 2, 3):
        ob.place_order(i, {"total": i * 10})
    sent = []
    def flaky(e):
        if e["order_id"] == 2 and len(sent) == 1 and not getattr(flaky, "failed", False):
            flaky.failed = True
            raise ConnectionError
        sent.append(e["order_id"])
    assert ob.relay(flaky) == 1
    assert ob.relay(flaky) == 2
    assert sent == [1, 2, 3] and ob.relay(flaky) == 0


def test_idempotency():
    store, calls = IdempotencyStore(), []
    fn = lambda: calls.append(1) or {"charged": 100}
    assert store.execute("k1", {"amount": 100}, fn) == {"charged": 100}
    assert store.execute("k1", {"amount": 100}, fn) == {"charged": 100}
    assert len(calls) == 1
    with pytest.raises(IdempotencyConflict):
        store.execute("k1", {"amount": 999}, fn)
