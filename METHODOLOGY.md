# Learning methodology

Every chapter, old or new, follows the same six steps and its README has the same six sections, so you always know
what to do next. The [showcase site](https://anandmukul93.github.io/system-design-handson/site/) renders each chapter with its runnable demo.

| Step | README section | What you do | Done when |
|------|----------------|-------------|-----------|
| 1 | **Concepts** | Read the short explanation of every concept the chapter covers (and the linked notes for 01-28). | You can explain each concept in two sentences without notes. |
| 2 | **Trade-offs and optimizations** | Learn the knobs, the costs and the standard optimizations. | You can argue both sides of each trade-off. |
| 3 | **Demo** | Play with the interactive simulation in the browser; change its source and re-run it. | You've predicted what a control will do before moving it, and been right. |
| 4 | **Build it** | Design first (`DESIGN.md`), then implement the Python stubs until the tests pass, then do the milestones with real infrastructure. | `pytest NN-slug` is green and milestones are ticked. |
| 5 | **Break it** | Run the failure experiments: kill, partition, overload, corrupt. | You've seen each failure happen and recorded what you observed. |
| 6 | **Review** | Answer the review questions, compare with the notes, and write results in the README. | You'd be comfortable whiteboarding the chapter in an interview. |

## The demo sandbox

- Demos live in `NN-slug/demo/` as plain JavaScript, split so the idea is separate from the page:
  - **Logic files** (`token_bucket.js`, `hash_ring.js`, ...) hold one concept or one variant each. They export plain
    classes and functions, never touch the page, and take anything impure (a clock, a random source, a hash function)
    as an argument. Variants of the same idea share one contract, written at the top of the file, so you can swap them
    or add your own.
  - **`ui.js`** is the only file that builds controls. It imports the logic with
    `import { name } from "./file.js"` and talks to it only through that contract.
- Each `ui.js` uses a tiny helper kit ([`site/assets/kit.js`](site/assets/kit.js)) for sliders, buttons, charts,
  canvases and logs.
- Demos run in an `<iframe sandbox="allow-scripts">` with no access to the site, your cookies or storage.
- On the chapter page, **Edit source** opens every file as a tab in a syntax-highlighting editor (JavaScript for the
  demo, Python for the stubs and tests). Tabs are ordered so that a file comes after the files it imports, and
  `ui.js` is last. Your edits are kept in your browser; **Reset** restores the originals.
- The first line of every demo file is a `//` comment saying what the file is; the editor shows it under the tabs.
- Demo code is formatted with Prettier (`.prettierrc`, 110 columns).

## Python in the browser

**Run Python tests** loads [Pyodide](https://pyodide.org), copies the chapter's modules and tests into an in-browser
file system and runs pytest. You can edit the stubs on the page and re-run the tests until they pass, then copy your
code back into the repo. Tests marked `needs_threads` are skipped in the browser because WebAssembly Python has no
threads; run them locally.

## Writing a new chapter

Copy [`03-design-framework/CHAPTER_TEMPLATE.md`](03-design-framework/CHAPTER_TEMPLATE.md), add the chapter to
`course.json`, map its concepts in `concepts.json`, write the demo as logic files plus `demo/ui.js`, and run `make site-data` (which also checks
that all 111 concepts are mapped).
