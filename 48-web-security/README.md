# 48 · Web Application Security

> Phase 9: Security · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=48-web-security)

**Concepts covered:** #74 WAF · #75 DDoS Protection · #76 CORS · #77 CSRF · #78 SQL Injection · #79 XSS · #80 SSRF

## Goal
Attack and defend a small web app: CORS, CSRF, SQL injection, XSS, SSRF, plus the edge defences (WAF rules and DDoS protection).

## 1. Concepts
### WAF
A web application firewall inspects HTTP requests and blocks known attack patterns (SQLi, XSS, path traversal) and bad bots at the edge. Useful as a shield while you fix the code, never a replacement for fixing it.

### DDoS protection
Absorb or drop floods before they reach you: anycast CDNs, SYN cookies, rate limiting per IP/key (chapter 4), challenge pages, autoscaling with caps and caching. Volumetric attacks are handled upstream; application-layer floods need smart rate limits.

### CORS
Browsers block JavaScript from reading cross-origin responses unless the server opts in with Access-Control-Allow-* headers. Non-simple requests send an OPTIONS preflight first. Never reflect any Origin while allowing credentials.

### CSRF
A malicious site makes the victim's browser send an authenticated request to your site using its cookies. Defend with SameSite cookies, a CSRF token tied to the session for state-changing requests, and checking Origin.

### SQL injection
Concatenating input into SQL lets attackers change the query (`' OR '1'='1`). Always use parameterised queries; least-privileged DB users limit the damage.

### XSS
Attacker-controlled data rendered as HTML/JS runs in your users' browsers. Escape output for its context, use frameworks that auto-escape, sanitise rich HTML, and add a Content-Security-Policy.

### SSRF
Your server fetches a URL the attacker chose, reaching internal services or cloud metadata (169.254.169.254). Allow-list schemes and hosts, resolve and reject private/link-local addresses, and re-check after redirects.

## 2. Trade-offs and optimizations
- Defence in depth: fix the code, then add WAF, CSP and least privilege on top.
- SameSite=Lax cookies stop most CSRF; tokens are still needed for older browsers and same-site attackers.
- CORS is a browser relaxation of the same-origin policy, not a server-side access control.
- Validate SSRF targets after DNS resolution to stop DNS rebinding tricks.
- WAF rules have false positives; run in log-only mode first.

## 3. Demo
A vulnerable sandbox app with 'attack' and 'defend' toggles: inject SQL into a login form against a real in-browser SQLite, plant an XSS payload in comments and see it escaped, send cross-origin requests through a CORS policy editor, try SSRF URLs against a validator, and fire a request flood at a WAF and rate limiter.

- **In the browser:** [48-web-security on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=48-web-security). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`sql_login.js`](demo/sql_login.js), [`xss.js`](demo/xss.js), [`cors.js`](demo/cors.js), [`ssrf.js`](demo/ssrf.js), [`flood.js`](demo/flood.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=48-web-security>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `websec.py`: a CORS preflight evaluator, CSRF tokens, an HTML escaper, a safe parameterised query next to a deliberately unsafe one, an SSRF URL validator using `ipaddress`, and a tiny WAF rule matcher.
- OWASP Juice Shop in Docker to practise on, and a FastAPI app you harden step by step.

### Milestones
- [ ] Make `pytest 48-web-security` pass.
- [ ] Run OWASP Juice Shop in Docker and solve its SQLi, XSS and CSRF challenges.
- [ ] Add CSP, SameSite cookies and CSRF tokens to a FastAPI form app.

### Starter files
- [`tests/test_websec.py`](tests/test_websec.py)
- [`websec.py`](websec.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 48-web-security
```

### Stretch goals
- [ ] Run OWASP ZAP against your app.
- [ ] ModSecurity + Core Rule Set in front of nginx.
- [ ] Subresource Integrity and Trusted Types.

### Suggested stack
Python 3.11 (sqlite3, ipaddress), FastAPI, OWASP Juice Shop, OWASP ZAP, pytest

## 5. Break it
- [ ] Exploit the unsafe query in `websec.py` with `' OR '1'='1`.
- [ ] Fetch `http://169.254.169.254/` through an unprotected URL preview endpoint.
- [ ] Reflect `Origin` with `Allow-Credentials: true` and steal data from another origin page.

## 6. Review
- Why isn't CORS a security boundary for your API?
- What do SameSite cookies prevent?
- Why must SSRF checks happen after DNS resolution?
- Where should HTML escaping happen?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
