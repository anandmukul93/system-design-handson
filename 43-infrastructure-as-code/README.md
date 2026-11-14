# 43 · Infrastructure as Code: Terraform & Helm

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=43-infrastructure-as-code)

**Concepts covered:** #104 Infrastructure as Code · #105 Terraform · #106 Helm Charts

## Goal
Understand the engine behind `terraform plan` and `helm template` by building them small: diff desired vs current state into a plan, order changes by dependency, and render templated manifests from values.

## 1. Concepts
### Infrastructure as code
Describe infrastructure in versioned files instead of clicking in consoles. You get reviewable changes, reproducible environments and drift detection. Declarative tools say what should exist; the tool works out how.

### Terraform
Reads your config (desired), its state file (what it created) and the provider APIs (what exists), then produces a plan of create/update/replace/delete actions in dependency order. Some attribute changes force replacement. State must be stored remotely with locking for teams.

### Helm charts
Kubernetes packages: templates plus a values file. `helm template` renders Go templates with values into manifests; releases track installed versions so you can upgrade and roll back.

## 2. Trade-offs and optimizations
- Declarative (Terraform, Helm) vs imperative scripts: declarative tools handle drift and ordering for you.
- Remote state + locking (S3 + DynamoDB, Terraform Cloud) or two applies will corrupt state.
- Watch for forced replacements in plans: they can mean downtime or data loss.
- Keep modules/charts small and versioned; pin provider and chart versions.
- Separate environments by workspace or directory, not by copy-paste.

## 3. Demo
Edit a desired-infrastructure document in the browser and watch a plan update live with create, update, replace and delete actions in dependency order, then 'apply' it to see the state change. A second panel renders a Helm-style template from editable values.

- **In the browser:** [43-infrastructure-as-code on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=43-infrastructure-as-code). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=43-infrastructure-as-code>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `iac.py`: a plan engine with forced-replacement attributes, dependency-ordered apply/destroy, and a tiny `{{ .Values.x }}` template renderer with `default`.
- Real Terraform for a local Docker provider (nginx + Postgres containers) and a Helm chart for the chapter 8 service.

### Milestones
- [ ] Make `pytest 43-infrastructure-as-code` pass.
- [ ] Use Terraform's Docker provider to create a network, Postgres and the app container; change an env var and read the plan.
- [ ] Package the chapter 8 service as a Helm chart with values for dev and prod and install it on kind.

### Starter files
- [`iac.py`](iac.py)
- [`tests/test_iac.py`](tests/test_iac.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 43-infrastructure-as-code
```

### Stretch goals
- [ ] Write a Terraform module and publish it to a local registry.
- [ ] Pulumi or CDK version of the same stack.
- [ ] Policy as code with OPA/Conftest on the plan JSON.

### Suggested stack
Terraform 1.x (Docker provider), Helm 3, kind, Python 3.11, pytest

## 5. Break it
- [ ] Change something by hand (drift) and run `terraform plan`.
- [ ] Run two `terraform apply` at once against local state.
- [ ] Change an attribute that forces replacement on the database and read the plan carefully.

## 6. Review
- What three inputs does `terraform plan` compare?
- Why does Terraform need a state file?
- When does an update become a replace?
- What does `helm rollback` rely on?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
