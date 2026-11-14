from api_edge import Gateway, SmoothWeightedRR, sign_webhook, verify_webhook


def test_smooth_wrr_sequence():
    rr = SmoothWeightedRR({"a": 5, "b": 1, "c": 1})
    assert [rr.next() for _ in range(7)] == ["a", "a", "b", "a", "c", "a", "a"]


def test_gateway_versions_and_prefix():
    gw = Gateway({("v1", "/users"): "users-v1", ("v2", "/users"): "users-v2",
                  ("v1", "/users/admin"): "admin", ("v1", "/"): "web"})
    assert gw.route("/v2/users/42") == ("users-v2", "v2", "/users/42")
    assert gw.route("/users/42", {"API-Version": "v2"}) == ("users-v2", "v2", "/users/42")
    assert gw.route("/users/admin/x") == ("admin", "v1", "/users/admin/x")
    assert gw.route("/about") == ("web", "v1", "/about")
    assert gw.route("/v3/users") is None


def test_webhook_signatures():
    s = b"whsec"
    sig = sign_webhook(s, 1000, b'{"id":1}')
    assert verify_webhook(s, sig, 1000, b'{"id":1}', now=1100)
    assert not verify_webhook(s, sig, 1000, b'{"id":2}', now=1100)      # tampered
    assert not verify_webhook(s, sig, 1000, b'{"id":1}', now=2000)      # replayed late
    assert not verify_webhook(b"other", sig, 1000, b'{"id":1}', now=1100)
