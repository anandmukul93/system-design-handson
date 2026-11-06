import pytest
from payments import Ledger, PaymentService, PSPError, UnbalancedError, reconcile


def test_ledger_balanced():
    l = Ledger()
    l.post("t1", [("buyer", 1000, 0), ("seller", 0, 1000)])
    assert l.balance("seller") == 1000 and l.balance("buyer") == -1000
    with pytest.raises(UnbalancedError):
        l.post("t2", [("buyer", 500, 0), ("seller", 0, 400)])
    assert len(l.entries) == 2


def test_idempotent_payment():
    calls = []
    svc = PaymentService(psp=lambda oid, amt: calls.append(oid) or f"psp-{len(calls)}", ledger=Ledger())
    a = svc.pay("key-1", "buyer", "seller", 1000)
    b = svc.pay("key-1", "buyer", "seller", 1000)
    assert a["status"] == b["status"] == "SUCCESS"
    assert len(calls) == 1
    assert svc.ledger.balance("seller") == 1000


def test_failed_then_retry():
    attempts = []

    def flaky(oid, amt):
        attempts.append(1)
        if len(attempts) == 1:
            raise PSPError("timeout")
        return "ref"

    svc = PaymentService(psp=flaky, ledger=Ledger())
    assert svc.pay("k", "b", "s", 50)["status"] == "FAILED"
    assert svc.ledger.balance("s") == 0
    assert svc.pay("k", "b", "s", 50)["status"] == "SUCCESS"
    assert svc.ledger.balance("s") == 50


def test_reconcile():
    r = reconcile({"a": 10, "b": 20, "c": 30}, {"a": 10, "b": 25, "d": 40})
    assert r == {"missing_in_ledger": ["d"], "missing_in_psp": ["c"], "amount_mismatch": ["b"]}
