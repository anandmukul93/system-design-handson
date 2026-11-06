# 03 · A Framework for System Design Interviews

> Notes: [A Framework for System Design Interviews](https://github.com/liquidslr/system-design-notes/tree/main/03.%20System%20Design%20Framework) · Phase 0: Foundations · Suggested time: 1 day + ongoing

## Goal
Turn the 4-step framework into a habit: a design-doc template you fill for every chapter, plus a timer that runs you through a 45-minute mock.

## What you'll build
- `DESIGN_TEMPLATE.md`: requirements, estimates, API, data model, high-level diagram, deep dives, trade-offs, wrap-up.
- `mock_timer.py`: a terminal timer that walks through the 4 steps with suggested minutes and prompts.
- A filled-in design doc for every chapter folder (`NN-*/DESIGN.md`), written before you code that chapter.

## Key concepts exercised
- Clarifying scope
- High-level design and buy-in
- Deep dives
- Wrap-up: bottlenecks, failure modes, next steps
- Time management

## Milestones
- [ ] Run `python mock_timer.py` and do chapter 8 (URL shortener) on paper in 45 minutes.
- [ ] Copy `DESIGN_TEMPLATE.md` into `08-url-shortener/DESIGN.md` and write it up properly.
- [ ] Repeat for each chapter before you start coding it. Compare your doc with the notes afterwards.

## Stretch goals
- [ ] Record yourself explaining a design and review it against the Dos and Don'ts.
- [ ] Do a mock with a friend using a chapter you haven't read yet.
- [ ] Keep a `MISTAKES.md` log of things you forgot to ask or estimate.

## Suggested stack
Markdown, Python 3.11 (stdlib only)

## Starter files
- `DESIGN_TEMPLATE.md`
- `mock_timer.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
python 03-design-framework/mock_timer.py
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
