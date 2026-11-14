# 42 · Containers & Orchestration

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=42-containers-orchestration)

**Concepts covered:** #7 Docker · #8 Kubernetes · #9 Service Discovery · #56 Health Checks · #57 Liveness & Readiness Probes

## Goal
Learn what Docker and Kubernetes actually do by writing the core loops yourself: a reconciler that drives actual state to desired state, liveness/readiness probes with CrashLoopBackOff, and a service registry with TTL heartbeats.

## 1. Concepts
### Docker
A container is a process with its own filesystem (an image made of layers), namespaces (pid, net, mnt) and cgroup limits. Images are built from a Dockerfile; layer order decides cache hits; multi-stage builds keep runtime images small.

### Kubernetes
A control plane that stores desired state (Deployments, Services) in etcd and runs controllers that continuously reconcile actual state toward it: create missing pods, delete extra ones, reschedule pods from dead nodes.

### Service discovery
Clients need the current addresses of healthy instances. Options: DNS (Kubernetes Services), a registry with heartbeats (Consul, Eureka, etcd) or a sidecar/mesh. Entries must expire when instances die.

### Health checks
Endpoints or commands that tell the platform or load balancer whether an instance works. Keep them cheap and honest; a check that only returns 200 tells you nothing.

### Liveness & readiness probes
Liveness failing means 'restart me' (deadlocked, wedged). Readiness failing means 'don't send me traffic yet' (warming up, dependency down). Mixing them up causes restart storms. Startup probes protect slow starters.

## 2. Trade-offs and optimizations
- Readiness should check what the instance needs to serve; liveness should almost never check dependencies.
- CrashLoopBackOff's exponential delay protects the node but slows recovery.
- Small images (distroless, multi-stage) start faster and have fewer CVEs.
- Requests/limits: requests drive scheduling, limits drive throttling and OOM kills.
- Client-side discovery is faster; server-side (load balancer) is simpler for clients.

## 3. Demo
A mini cluster: set the desired replica count, kill pods, fail a node and watch the reconciler restore state. Flip a pod's liveness or readiness and see it restarted with backoff or pulled from the Service endpoints while traffic keeps flowing to the rest.

- **In the browser:** [42-containers-orchestration on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=42-containers-orchestration). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=42-containers-orchestration>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `orchestration.py`: a replica reconciler, endpoint selection from probe results, CrashLoopBackOff delays, and a TTL-based service registry.
- A Dockerfile (multi-stage) for one earlier chapter's service and Kubernetes manifests (Deployment with probes, Service, ConfigMap) running on kind.

### Milestones
- [ ] Make `pytest 42-containers-orchestration` pass.
- [ ] Containerise the chapter 8 URL shortener with a multi-stage Dockerfile; compare image sizes.
- [ ] Deploy it on kind with readiness and liveness probes and scale to 5 replicas.

### Starter files
- [`orchestration.py`](orchestration.py)
- [`tests/test_orchestration.py`](tests/test_orchestration.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 42-containers-orchestration
```

### Stretch goals
- [ ] Write a tiny Kubernetes controller (kopf) that reconciles a custom resource.
- [ ] Run Consul and register services with health checks.
- [ ] Build a container by hand with `unshare` and `chroot`.

### Suggested stack
Docker, kind or k3d, kubectl, Python 3.11, pytest

## 5. Break it
- [ ] Make the liveness probe check the database, stop the database and watch every pod restart.
- [ ] Delete pods in a loop while running a load test; check for errors.
- [ ] Set a memory limit below the app's need and read the OOMKilled reason.

## 6. Review
- What's the difference between liveness and readiness?
- What does a Kubernetes controller do in its loop?
- Why must registry entries expire?
- Why put dependency installation before `COPY .` in a Dockerfile?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
