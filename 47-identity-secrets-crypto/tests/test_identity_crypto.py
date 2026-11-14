import pytest
from identity_crypto import InvalidToken, b64url, b64url_decode, iam_allowed, jwt_sign, jwt_verify, pkce_challenge, redact


def test_b64url():
    assert b64url(b"\xfb\xff") == "-_8"
    assert b64url_decode("-_8") == b"\xfb\xff"


def test_jwt_roundtrip_and_tamper():
    keys = {"k1": b"secret-one"}
    tok = jwt_sign({"sub": "u1", "exp": 100}, keys, "k1")
    assert tok.count(".") == 2
    assert jwt_verify(tok, keys, now=50) == {"sub": "u1", "exp": 100}
    h, p, s = tok.split(".")
    forged = h + "." + b64url(b'{"sub":"admin","exp":100}') + "." + s
    with pytest.raises(InvalidToken):
        jwt_verify(forged, keys, now=50)
    with pytest.raises(InvalidToken):
        jwt_verify(tok, keys, now=100)


def test_key_rotation():
    old = jwt_sign({"sub": "u1"}, {"k1": b"one"}, "k1")
    keys = {"k1": b"one", "k2": b"two"}
    new = jwt_sign({"sub": "u2"}, keys, "k2")
    assert jwt_verify(old, keys, 0)["sub"] == "u1"
    assert jwt_verify(new, keys, 0)["sub"] == "u2"
    del keys["k1"]
    with pytest.raises(InvalidToken):
        jwt_verify(old, keys, 0)


def test_pkce_rfc7636():
    assert pkce_challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk") == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"


def test_iam():
    pol = [{"effect": "Allow", "actions": ["s3:Get*", "s3:List*"], "resources": ["arn:bucket/*"]},
           {"effect": "Deny", "actions": ["s3:*"], "resources": ["arn:bucket/secret/*"]}]
    assert iam_allowed(pol, "s3:GetObject", "arn:bucket/photos/a.jpg")
    assert not iam_allowed(pol, "s3:PutObject", "arn:bucket/photos/a.jpg")
    assert not iam_allowed(pol, "s3:GetObject", "arn:bucket/secret/key")


def test_redact():
    s = "key=AKIAABCDEFGHIJKLMNOP user=bob password=hunter2&next=1 token=abc"
    assert redact(s) == "key=AKIA**************** user=bob password=***&next=1 token=***"
