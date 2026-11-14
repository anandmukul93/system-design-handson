import sqlite3

from websec import (cors_preflight, csrf_ok, csrf_token, escape_html, find_user_safe, find_user_unsafe,
                    is_safe_url, waf_check)

POLICY = {"origins": ["https://app.example.com"], "methods": ["GET", "POST"],
          "headers": ["Content-Type", "X-Api-Key"], "credentials": True}


def test_cors():
    ok = cors_preflight("https://app.example.com", "POST", ["content-type"], POLICY)
    assert ok == {"Access-Control-Allow-Origin": "https://app.example.com",
                  "Access-Control-Allow-Methods": "GET, POST",
                  "Access-Control-Allow-Headers": "content-type",
                  "Access-Control-Allow-Credentials": "true"}
    assert cors_preflight("https://evil.com", "POST", [], POLICY) is None
    assert cors_preflight("https://app.example.com", "DELETE", [], POLICY) is None
    assert cors_preflight("https://app.example.com", "GET", ["X-Admin"], POLICY) is None


def test_csrf():
    s = b"k"
    t = csrf_token("sess1", s)
    assert csrf_ok("GET", "sess1", None, s)
    assert csrf_ok("POST", "sess1", t, s)
    assert not csrf_ok("POST", "sess1", None, s)
    assert not csrf_ok("POST", "sess2", t, s)


def test_escape():
    assert escape_html("<img src=x onerror=\"alert('x')\">&") == "&lt;img src=x onerror=&quot;alert(&#x27;x&#x27;)&quot;&gt;&amp;"


def test_sql_injection():
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE users(id INTEGER, name TEXT)")
    conn.executemany("INSERT INTO users VALUES (?, ?)", [(1, "alice"), (2, "bob")])
    attack = "x' OR '1'='1"
    assert len(find_user_unsafe(conn, attack)) == 2      # the bug
    assert find_user_safe(conn, attack) == []
    assert find_user_safe(conn, "bob") == [(2, "bob")]


def test_ssrf():
    dns = {"example.com": ["93.184.216.34"], "internal.corp": ["10.0.0.5"], "rebind.evil": ["93.184.216.34", "127.0.0.1"]}
    r = lambda h: dns.get(h, [h])
    assert is_safe_url("https://example.com/a", r)
    assert not is_safe_url("http://internal.corp/", r)
    assert not is_safe_url("http://169.254.169.254/latest/meta-data", r)
    assert not is_safe_url("http://rebind.evil/", r)
    assert not is_safe_url("file:///etc/passwd", r)
    assert not is_safe_url("gopher://example.com/", r)


def test_waf():
    assert waf_check("/search", "q=1 UNION SELECT password FROM users") == "sqli"
    assert waf_check("/c", "", "<script>alert(1)</script>") == "xss"
    assert waf_check("/files/../../etc/passwd", "") == "traversal"
    assert waf_check("/search", "q=union station") is None
