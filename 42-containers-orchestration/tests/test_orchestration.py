from orchestration import Reconciler, ServiceRegistry, crashloop_delay, endpoints


def test_reconcile_up_and_heal():
    r = Reconciler(desired=3)
    assert r.reconcile() == [("create", "pod-1"), ("create", "pod-2"), ("create", "pod-3")]
    r.pods["pod-2"] = "Failed"
    assert r.reconcile() == [("delete", "pod-2"), ("create", "pod-4")]
    assert sorted(r.pods) == ["pod-1", "pod-3", "pod-4"]
    assert r.reconcile() == []


def test_reconcile_scale_down():
    r = Reconciler(desired=3)
    r.reconcile()
    r.desired = 1
    assert r.reconcile() == [("delete", "pod-3"), ("delete", "pod-2")]
    assert r.pods == {"pod-1": "Pending", "pod-2": "Terminating", "pod-3": "Terminating"}


def test_probes():
    pods = {"a": {"live": True, "ready": True}, "b": {"live": True, "ready": False},
            "c": {"live": False, "ready": True}}
    assert endpoints(pods) == ["a"]
    assert [crashloop_delay(n) for n in range(7)] == [0, 10, 20, 40, 80, 160, 300]


def test_registry_ttl():
    reg = ServiceRegistry(ttl=10)
    reg.register("api", "10.0.0.1:80", now=0)
    reg.register("api", "10.0.0.2:80", now=0)
    reg.heartbeat("api", "10.0.0.2:80", now=8)
    assert reg.lookup("api", now=9) == ["10.0.0.1:80", "10.0.0.2:80"]
    assert reg.lookup("api", now=12) == ["10.0.0.2:80"]
    assert reg.lookup("missing", now=0) == []
