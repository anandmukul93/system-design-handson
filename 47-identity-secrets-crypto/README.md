# 47 · Identity, Secrets & Encryption

> Phase 9: Security · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=47-identity-secrets-crypto)

**Concepts covered:** #67 Secrets Management · #68 IAM · #69 OAuth · #70 JWT Rotation · #71 TLS · #72 Encryption at Rest · #73 Encryption in Transit

## Goal
Build the security plumbing every service needs: JWTs with key rotation, OAuth's PKCE, IAM policy evaluation, secret redaction, and envelope encryption at rest and TLS in transit.

## 1. Concepts
### Secrets management
Keep credentials out of code, images and logs. Store them in a vault (HashiCorp Vault, AWS Secrets Manager, Kubernetes secrets + KMS), inject at runtime, rotate regularly, prefer short-lived dynamic credentials, and scan repos for leaks.

### IAM
Identity and access management: who (principal) may do what (action) on which resource. Policies are evaluated with default deny, explicit allow, and explicit deny always winning. Grant least privilege and prefer roles over long-lived keys.

### OAuth
A delegation protocol: a user lets a client app act on their behalf at a resource server without sharing their password. The authorization code flow with PKCE (a hashed one-time verifier) is the right choice for browser and mobile apps. OpenID Connect adds identity (ID tokens) on top.

### JWT rotation
JWTs are signed, self-contained tokens. Put a key id (`kid`) in the header so verifiers can pick the right key, publish keys (JWKS), sign new tokens with the new key while still accepting the old one until old tokens expire, then retire it. Keep tokens short-lived.

### TLS
Authenticates the server with a certificate chain and negotiates session keys (TLS 1.3: one round trip, forward secrecy). mTLS also authenticates the client, common between services in a mesh.

### Encryption at rest
Data on disk is encrypted so stolen disks or backups are useless. Envelope encryption: each object gets a random data key (DEK) used with AES-GCM; the DEK is encrypted by a master key (KEK) in a KMS. Rotating the KEK only re-wraps DEKs.

### Encryption in transit
Everything on the network uses TLS, including internal traffic: zero-trust assumes the internal network is hostile. Terminate TLS at the edge only if the hop behind it is also protected.

## 2. Trade-offs and optimizations
- Short-lived tokens limit damage but need refresh flows; long-lived tokens need revocation lists.
- HS256 needs a shared secret on every verifier; RS256/ES256 lets verifiers hold only public keys.
- Envelope encryption keeps the master key in the KMS and makes key rotation cheap.
- Least privilege costs setup time but caps the blast radius of a leaked credential.
- Never roll your own crypto primitives; do learn how to compose them.

## 3. Demo
In the browser with WebCrypto: issue JWTs under key k1, rotate to k2 and watch old tokens still verify until k1 is retired; tamper with a token to break its signature; envelope-encrypt a message with AES-GCM and a wrapped data key; run the PKCE flow step by step; and evaluate IAM policies against requests.

- **In the browser:** [47-identity-secrets-crypto on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=47-identity-secrets-crypto). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`encoding.js`](demo/encoding.js), [`jwt.js`](demo/jwt.js), [`envelope.js`](demo/envelope.js), [`pkce.js`](demo/pkce.js), [`iam.js`](demo/iam.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=47-identity-secrets-crypto>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `identity_crypto.py`: base64url helpers, HS256 JWT sign/verify with `kid` rotation and expiry, PKCE S256 challenges, an IAM policy evaluator with wildcards and explicit deny, and a secret redactor for logs.
- Vault in dev mode serving dynamic Postgres credentials to a FastAPI app; nginx with a local CA issuing TLS and mTLS certificates.

### Milestones
- [ ] Make `pytest 47-identity-secrets-crypto` pass.
- [ ] Run Vault in dev mode and fetch short-lived Postgres credentials from an app.
- [ ] Create a local CA with `openssl`, serve HTTPS from nginx and require client certificates for one route.

### Starter files
- [`identity_crypto.py`](identity_crypto.py)
- [`tests/test_identity_crypto.py`](tests/test_identity_crypto.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 47-identity-secrets-crypto
```

### Stretch goals
- [ ] RS256 with a JWKS endpoint and key rollover.
- [ ] OIDC login with Keycloak or Dex in front of chapter 8.
- [ ] SPIFFE/SPIRE workload identities for mTLS.

### Suggested stack
Python 3.11 (hmac, hashlib, base64), Vault, OpenSSL, nginx, WebCrypto in the demo, pytest

## 5. Break it
- [ ] Accept `alg: none` by mistake in a verifier and forge a token.
- [ ] Commit a fake AWS key to a test repo and see secret scanning catch it.
- [ ] Retire the old signing key before old tokens expire and count the logouts.

## 6. Review
- Why does a JWT header carry a `kid`?
- What attack does PKCE stop?
- Why does explicit deny win in IAM?
- What does envelope encryption buy you over one master key?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
