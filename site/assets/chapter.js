(async function () {
  const REPO = "https://github.com/anandmukul93/system-design-handson";
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch {}
    },
  };
  const text = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ": " + r.status);
    return r.text();
  };

  const data = await (await fetch("data/site.json")).json();
  const dir = new URLSearchParams(location.search).get("ch") || data.chapters[0].dir;
  const idx = data.chapters.findIndex((c) => c.dir === dir);
  if (idx < 0) {
    $("title").textContent = "Chapter not found";
    return;
  }
  const ch = data.chapters[idx];
  const byId = Object.fromEntries(data.concepts.map((c) => [c.id, c]));
  const phase = data.phases.find((p) => p.id === ch.phase);
  const base = `../${ch.dir}/`;

  document.title = `${ch.num} ${ch.title} · System Design, Hands-On`;
  $("crumbs").innerHTML =
    `<a href="./#chapters">Chapters</a> / Phase ${phase.id}: ${esc(phase.name)} / ${ch.num}` +
    (ch.notes ? ` · <a href="${ch.notes}">chapter notes</a>` : "");
  $("title").textContent = `${ch.num} · ${ch.title}`;
  $("goal").textContent = ch.goal;
  $("chips").innerHTML = ch.concepts
    .map(
      (id) =>
        `<span class="chip ${byId[id].status}" title="${byId[id].status}">#${id} ${esc(byId[id].name)}</span>`,
    )
    .join("");
  $("gh").href = `${REPO}/tree/main/${ch.dir}`;
  $("readme-link").href = `${REPO}/blob/main/${ch.dir}/README.md`;
  const prev = data.chapters[idx - 1],
    next = data.chapters[idx + 1];
  $("pager").innerHTML =
    (prev
      ? `<a class="btn" href="chapter.html?ch=${prev.dir}">← ${prev.num} ${esc(prev.title)}</a>`
      : "<span></span>") +
    (next ? `<a class="btn" href="chapter.html?ch=${next.dir}">${next.num} ${esc(next.title)} →</a>` : "");

  // ---------------- lesson ----------------
  try {
    const md = await text(base + "README.md");
    const html = DOMPurify.sanitize(marked.parse(md));
    const art = $("lesson");
    art.innerHTML = html;
    art.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (/^(https?:|mailto:|#)/.test(href)) return;
      const m = href.match(/^\.\.\/(\d\d-[a-z0-9-]+)\/?$/);
      if (m) {
        a.href = `chapter.html?ch=${m[1]}`;
        return;
      }
      const path = new URL(href, `https://x/${ch.dir}/`).pathname.slice(1);
      a.href = `${REPO}/blob/main/${path}`;
    });
  } catch (e) {
    $("lesson").innerHTML = `<p class="err">Could not load the README (${esc(e.message)}).</p>`;
  }

  // ---------------- editors ----------------
  // One editor per panel; each file is its own document, so undo history and scroll position stay per tab.
  const LANG = {
    js: ["JavaScript", "javascript"],
    py: ["Python", "python"],
    json: ["JSON", { name: "javascript", json: true }],
    md: ["Markdown", null],
  };
  const langOf = (f) => LANG[f.split(".").pop()] || ["Text", null];
  function makeEditor({ host, tabsEl, barEl, files, originals, keyOf, describe, role, onRun }) {
    const buffers = {},
      docs = {};
    for (const f of files) buffers[f] = store.get(keyOf(f)) ?? originals[f];
    let current = files[0],
      cm = null,
      ta = null;
    const changed = (f) => buffers[f] !== originals[f];
    const persist = (f) => (changed(f) ? store.set(keyOf(f), buffers[f]) : store.del(keyOf(f)));
    function paintTabs() {
      tabsEl.innerHTML = files
        .map(
          (f) =>
            `<button data-f="${esc(f)}" class="${f === current ? "on" : ""}" title="${esc(describe(f))}">${esc(f)}` +
            (role(f) ? `<span class="role">${esc(role(f))}</span>` : "") +
            (changed(f) ? '<span class="dot" title="edited"></span>' : "") +
            "</button>",
        )
        .join("");
      tabsEl.querySelectorAll("button").forEach((b) => (b.onclick = () => show(b.dataset.f)));
      barEl.innerHTML =
        `<span class="lang">${langOf(current)[0]}</span><span class="desc">${esc(describe(current))}</span>` +
        `<span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> run · <kbd>Ctrl</kbd>+<kbd>/</kbd> comment</span>`;
    }
    function onEdit(value) {
      const was = changed(current);
      buffers[current] = value;
      persist(current);
      if (was !== changed(current)) paintTabs();
    }
    if (window.CodeMirror) {
      for (const f of files) docs[f] = CodeMirror.Doc(buffers[f], langOf(f)[1]);
      cm = CodeMirror(host, {
        value: docs[current],
        mode: langOf(current)[1],
        lineNumbers: true,
        tabSize: 2,
        indentUnit: files[0].endsWith(".py") ? 4 : 2,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        lineWrapping: false,
        viewportMargin: 50,
        extraKeys: {
          "Ctrl-Enter": onRun,
          "Cmd-Enter": onRun,
          "Ctrl-/": "toggleComment",
          "Cmd-/": "toggleComment",
          Tab: (c) => c.execCommand(c.somethingSelected() ? "indentMore" : "insertSoftTab"),
        },
      });
      cm.on("change", () => onEdit(cm.getValue()));
    } else {
      // CDN blocked: plain textarea still works
      ta = document.createElement("textarea");
      ta.className = "code";
      ta.spellcheck = false;
      host.append(ta);
      ta.value = buffers[current];
      ta.addEventListener("input", () => onEdit(ta.value));
      ta.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          onRun();
        }
      });
    }
    function show(f) {
      current = f;
      if (cm) {
        cm.swapDoc(docs[f]);
        cm.refresh();
      } else ta.value = buffers[f];
      paintTabs();
    }
    paintTabs();
    return {
      buffers,
      changed,
      refresh: () => cm && cm.refresh(),
      anyChanged: () => files.some(changed),
      reset() {
        for (const f of files) {
          buffers[f] = originals[f];
          store.del(keyOf(f));
          if (cm) docs[f].setValue(originals[f]);
        }
        if (ta) ta.value = buffers[current];
        paintTabs();
      },
    };
  }
  // first comment line of a file is its one-line description
  const firstComment = (src) => {
    const m = src.match(/^\s*(?:\/\/|#)\s*(.+)|^\s*"""(.+?)(?:"""|$)/m);
    return m ? (m[1] || m[2]).trim() : "";
  };

  // ---------------- demo ----------------
  // demo/*.js: implementation files export plain classes/functions (no DOM); ui.js imports them and builds the controls.
  // Inside the sandbox each file becomes a module; `import { x } from "./file.js"` and `export` are rewritten to a tiny registry.
  const kit = await text("assets/kit.js");
  const demoFiles = ch.demo || ["demo.js"];
  const entry = demoFiles[demoFiles.length - 1];
  const demoOriginals = {};
  await Promise.all(
    demoFiles.map(async (f) => {
      try {
        demoOriginals[f] = await text(base + "demo/" + f);
      } catch (e) {
        demoOriginals[f] = `K.title("No demo yet"); K.note(${JSON.stringify(e.message)});`;
      }
    }),
  );
  const frame = $("frame");
  function toModule(name, code) {
    const names = [];
    code = code
      .replace(
        /^import\s*\{([^}]*)\}\s*from\s*["']\.\/([^"']+)["'];?/gm,
        (_, list, file) => `const {${list.replace(/\s+as\s+/g, ": ")}} = __require(${JSON.stringify(file)});`,
      )
      .replace(
        /^export\s+(?=(?:async\s+)?(?:class|function\*?|const|let)\s+([A-Za-z_$][\w$]*))/gm,
        (_, n) => {
          names.push(n);
          return "";
        },
      );
    return `__define(${JSON.stringify(name)}, function (__require, __exports) {${code}\n${names.map((n) => `__exports.${n} = ${n};`).join(" ")}\n});\n//# sourceURL=${name}`;
  }
  function runDemo() {
    const edited = demoEd.anyChanged();
    $("demo-status").textContent = edited ? "running your edited version" : "";
    $("demo-status").className = "status";
    const boot = `
      window.addEventListener("error", (e) => parent.postMessage({ type: "demo-error", msg: e.message + (e.lineno ? " (" + ((e.filename || "").split("/").pop() || "demo") + " line " + e.lineno + ")" : "") }, "*"));
      window.addEventListener("unhandledrejection", (e) => parent.postMessage({ type: "demo-error", msg: String(e.reason) }, "*"));
      new ResizeObserver(() => parent.postMessage({ type: "demo-height", h: document.documentElement.scrollHeight }, "*")).observe(document.documentElement);
      const __mods = {}, __cache = {};
      function __define(name, fn) { __mods[name] = fn; }
      function __require(name) {
        if (__cache[name]) return __cache[name];
        if (!__mods[name]) throw new Error('cannot import "./' + name + '": no such file in this demo');
        const exports = (__cache[name] = {});
        __mods[name](__require, exports);
        return exports;
      }`;
    const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
    const scripts = demoFiles
      .map((f) => `<script>${safe(toModule(f, demoEd.buffers[f]))}<\/script>`)
      .join("\n");
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body><div id="app"></div><script>${safe(boot)}<\/script><script>${safe(kit)}<\/script>${scripts}<script>__require(${JSON.stringify(entry)});<\/script></body></html>`;
  }
  const demoEd = makeEditor({
    host: $("demo-src"),
    tabsEl: $("demo-tabs"),
    barEl: $("demo-filebar"),
    files: demoFiles,
    originals: demoOriginals,
    keyOf: (f) => `sdh:${ch.dir}:demo/${f}`,
    describe: (f) => firstComment(demoOriginals[f]),
    role: (f) => (demoFiles.length === 1 ? "" : f === entry ? "ui" : "logic"),
    onRun: () => runDemo(),
  });
  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow || !e.data) return;
    if (e.data.type === "demo-error") {
      $("demo-status").textContent = "Error: " + e.data.msg;
      $("demo-status").className = "status err";
    }
    if (e.data.type === "demo-height")
      frame.style.height = Math.min(Math.max(e.data.h + 4, 320), 2400) + "px";
  });
  $("run").onclick = runDemo;
  $("edit").onclick = () => {
    $("demo-editor").classList.toggle("open");
    $("edit").textContent = $("demo-editor").classList.contains("open") ? "Hide source" : "Edit source";
    demoEd.refresh();
  };
  $("reset").onclick = () => {
    demoEd.reset();
    runDemo();
  };
  runDemo();

  // ---------------- python ----------------
  const files = ch.python;
  if (!files.length) {
    $("py-panel").style.display = "none";
    return;
  }
  const originals = {};
  await Promise.all(
    files.map(async (f) => {
      originals[f] = await text(base + f);
    }),
  );
  const ordered = [
    ...files.filter((f) => !f.startsWith("tests/")),
    ...files.filter((f) => f.startsWith("tests/")),
  ];
  const pyEd = makeEditor({
    host: $("py-src"),
    tabsEl: $("py-tabs"),
    barEl: $("py-filebar"),
    files: ordered,
    originals,
    keyOf: (f) => `sdh:${ch.dir}:${f}`,
    describe: (f) => firstComment(originals[f]),
    role: (f) => (f.startsWith("tests/") ? "tests" : "stub"),
    onRun: () => runTests(),
  });
  const buffers = pyEd.buffers;
  $("py-reset").onclick = () => pyEd.reset();

  let pyodide = null;
  async function getPyodide() {
    if (pyodide) return pyodide;
    $("py-status").textContent = "Loading Python (about 10 MB, first time only)…";
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = PYODIDE + "pyodide.js";
      s.onload = res;
      s.onerror = () => rej(new Error("could not load Pyodide"));
      document.head.append(s);
    });
    pyodide = await loadPyodide({ indexURL: PYODIDE });
    $("py-status").textContent = "Installing pytest…";
    await pyodide.loadPackage(["pytest"]);
    return pyodide;
  }
  async function runTests() {
    const btn = $("py-run");
    btn.disabled = true;
    $("py-out").textContent = "";
    try {
      const p = await getPyodide();
      $("py-status").textContent = "Running pytest…";
      p.runPython(
        "import shutil, os\nshutil.rmtree('/work', ignore_errors=True)\nos.makedirs('/work/ch/tests', exist_ok=True)",
      );
      for (const f of files) {
        const path = "/work/ch/" + f;
        p.FS.mkdirTree(path.slice(0, path.lastIndexOf("/")));
        p.FS.writeFile(path, buffers[f]);
      }
      p.FS.writeFile("/work/ch/pytest.ini", "[pytest]\nmarkers =\n    needs_threads: needs OS threads\n");
      const out = p.runPython(`
import sys, io, os, contextlib, pytest
for name, mod in list(sys.modules.items()):
    if str(getattr(mod, "__file__", "") or "").startswith("/work"):
        del sys.modules[name]
os.chdir("/work/ch")
if "/work/ch" not in sys.path:
    sys.path.insert(0, "/work/ch")
buf = io.StringIO()
with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
    rc = pytest.main(["-q", "-p", "no:cacheprovider", "-m", "not needs_threads", "--import-mode=importlib", "--tb=short", "tests"])
buf.getvalue() + f"\\n[exit code {int(rc)}]"`);
      $("py-out").textContent = out;
      const passed = /\[exit code 0\]/.test(out);
      $("py-status").textContent = passed
        ? "All tests pass. Copy your code back into the repo."
        : "Some tests fail (expected until you implement the stubs).";
      $("py-status").className = "status" + (passed ? "" : "");
    } catch (e) {
      $("py-out").textContent = String(e);
      $("py-status").textContent = "Could not run the tests in this browser.";
    } finally {
      btn.disabled = false;
    }
  }
  $("py-run").onclick = runTests;
})();
