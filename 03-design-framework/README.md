# 03 · A Framework for System Design Interviews

> Phase 0: Foundations · Suggested time: 1 day + ongoing · Notes: [A Framework for System Design Interviews](https://github.com/liquidslr/system-design-notes/tree/main/03.%20System%20Design%20Framework) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=03-design-framework)

**Concepts covered:** Foundations for the rest of the course

## Goal
Turn the 4-step framework into a habit: a design-doc template you fill for every chapter, plus a timer that runs you through a 45-minute mock.

## 1. Concepts
### Clarify scope
Spend the first minutes on users, features, scale and constraints. Designing the wrong system well still fails the interview.

### High-level design
Draw the main components and walk one request end to end, agree on APIs and data model before diving in.

### Deep dive
Pick the two or three hardest parts (the bottleneck, the consistency problem, the scaling path) and go deep with trade-offs.

### Wrap up
Summarise, name failure modes, monitoring and what you'd do with more time.

## 2. Trade-offs and optimizations
- Breadth first, then depth: don't spend 20 minutes on one table.
- Always pair a choice with its alternative and why you rejected it.
- Let the interviewer steer the deep dive; check in often.

## 3. Demo
An interactive mock interview: a timer walks through the four phases with prompts for the chosen system, and a checklist tracks whether you covered requirements, estimates, API, data model, scaling and failure modes before time runs out.

- **In the browser:** [03-design-framework on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=03-design-framework). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`framework.js`](demo/framework.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=03-design-framework>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `DESIGN_TEMPLATE.md`: requirements, estimates, API, data model, high-level diagram, deep dives, trade-offs, wrap-up.
- `mock_timer.py`: a terminal timer that walks through the 4 steps with suggested minutes and prompts.
- A filled-in design doc for every chapter folder (`NN-*/DESIGN.md`), written before you code that chapter.

### Milestones
- [ ] Run `python mock_timer.py` and do chapter 8 (URL shortener) on paper in 45 minutes.
- [ ] Copy `DESIGN_TEMPLATE.md` into `08-url-shortener/DESIGN.md` and write it up properly.
- [ ] Repeat for each chapter before you start coding it. Compare your doc with the notes afterwards.

### Starter files
- [`DESIGN_TEMPLATE.md`](DESIGN_TEMPLATE.md)
- [`mock_timer.py`](mock_timer.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
python 03-design-framework/mock_timer.py
```

### Stretch goals
- [ ] Record yourself explaining a design and review it against the Dos and Don'ts.
- [ ] Do a mock with a friend using a chapter you haven't read yet.
- [ ] Keep a `MISTAKES.md` log of things you forgot to ask or estimate.

### Suggested stack
Markdown, Python 3.11 (stdlib only)

## 5. Break it
- [ ] Skip requirements and start drawing; note what you had to redo.
- [ ] Go over time in one phase and see what you dropped.
- [ ] Present a design with no trade-offs and ask a friend to poke holes.

## 6. Review
- What do you ask in the first five minutes?
- How do you choose what to deep dive on?
- What belongs in a wrap-up?
- How would you split 45 minutes?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/03.%20System%20Design%20Framework).

## Results
_Write your measurements, failure experiments and surprises here._
