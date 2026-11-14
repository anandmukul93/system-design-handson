# 44 · CI/CD, Build Caching & Dependencies

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=44-cicd-dependencies)

**Concepts covered:** #6 CI/CD · #103 Semantic Versioning · #107 Build Caching · #108 Dependency Hell

## Goal
Build the pieces behind every pipeline: semantic version parsing and ranges, a dependency resolver that shows why dependency hell happens, and content-addressed build caching that skips unchanged steps.

## 1. Concepts
### CI/CD
Continuous integration builds and tests every change on a shared branch; continuous delivery keeps main always releasable and deploys through automated stages (build, test, staging, production) with gates. Fast, reliable pipelines are what make small frequent releases safe.

### Semantic versioning
MAJOR.MINOR.PATCH: breaking changes bump major, features bump minor, fixes bump patch; pre-releases (1.2.0-rc.1) sort before the release. Ranges like ^1.2.3 (same major) and ~1.2.3 (same minor) let tools pick compatible updates.

### Build caching
Hash every input of a build step (sources, dependencies, tool versions, env) into a cache key; if the key exists, reuse the output instead of rebuilding. Docker layers, Bazel, Gradle and CI caches all work this way.

### Dependency hell
Two packages need incompatible versions of a shared dependency, so no install satisfies both. Resolvers search for a consistent set (backtracking/SAT); lockfiles pin the result so builds are reproducible.

## 2. Trade-offs and optimizations
- Lockfiles give reproducible builds; regular automated updates (Dependabot/Renovate) stop drift.
- Cache keys must include every input or you'll get wrong cached results; too many inputs and you never hit.
- Run fast checks first (lint, unit) and slow ones in parallel later.
- ^0.x ranges are treated as breaking on minor bumps.
- Fewer direct dependencies = smaller conflict surface and attack surface.

## 3. Demo
A pipeline board where you edit files and dependency ranges and press 'Push': steps light up as cache hits or rebuilds based on their input hashes, and the resolver either produces a lockfile or explains exactly which constraints conflict.

- **In the browser:** [44-cicd-dependencies on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=44-cicd-dependencies). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`pipeline.js`](demo/pipeline.js), [`build_cache.js`](demo/build_cache.js), [`registry.js`](demo/registry.js), [`semver.js`](demo/semver.js), [`resolver.js`](demo/resolver.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=44-cicd-dependencies>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `cicd.py`: semver parse/compare/bump, range matching for ^, ~, comparators and exact versions, a backtracking dependency resolver, and content-addressed cache keys for pipeline steps.
- A GitHub Actions workflow for this repo: lint + pytest per chapter with pip caching and a matrix.

### Milestones
- [ ] Make `pytest 44-cicd-dependencies` pass.
- [ ] Write a GitHub Actions workflow running each chapter's tests in a matrix with caching; compare cold vs warm run times.
- [ ] Create a conflict between two local packages and read pip's resolver error.

### Starter files
- [`cicd.py`](cicd.py)
- [`tests/test_cicd.py`](tests/test_cicd.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 44-cicd-dependencies
```

### Stretch goals
- [ ] Bazel or Pants for a monorepo with remote cache.
- [ ] Release automation: conventional commits -> semver bump -> changelog -> tag.
- [ ] SBOM generation and vulnerability scanning in CI.

### Suggested stack
GitHub Actions, Python 3.11, pip-tools or uv, pytest

## 5. Break it
- [ ] Change one file and see which pipeline steps rerun.
- [ ] Leave a dependency unpinned and let a new release break the build.
- [ ] Put a non-deterministic value (timestamp) into a build and watch the cache never hit.

## 6. Review
- What does ^0.2.3 allow?
- Why does a lockfile make builds reproducible?
- What must a build cache key include?
- How do resolvers handle conflicting constraints?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
