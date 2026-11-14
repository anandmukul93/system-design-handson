(async function () {
  const REPO = "https://github.com/anandmukul93/system-design-handson";
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const text = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(url + ": " + r.status); return r.text(); };

  const data = await (await fetch("data/site.json")).json();
  const dir = new URLSearchParams(location.search).get("ch") || data.chapters[0].dir;
  const idx = data.chapters.findIndex((c) => c.dir === dir);
  if (idx < 0) { $("title").textContent = "Chapter not found"; return; }
  const ch = data.chapters[idx];
  const byId = Object.fromEntries(data.concepts.map((c) => [c.id, c]));
  const phase = data.phases.find((p) => p.id === ch.phase);
  const base = `../${ch.dir}/`;

  document.title = `${ch.num} ${ch.title} · System Design, Hands-On`;
  $("crumbs").innerHTML = `<a href="./#chapters">Chapters</a> / Phase ${phase.id}: ${esc(phase.name)} / ${ch.num}` +
    (ch.notes ? ` · <a href="${ch.notes}">chapter notes</a>` : "");
  $("title").textContent = `${ch.num} · ${ch.title}`;
  $("goal").textContent = ch.goal;
  $("chips").innerHTML = ch.concepts.map((id) => `<span class="chip ${byId[id].status}" title="${byId[id].status}">#${id} ${esc(byId[id].name)}</span>`).join("");
  $("gh").href = `${REPO}/tree/main/${ch.dir}`;
  $("readme-link").href = `${REPO}/blob/main/${ch.dir}/README.md`;
  const prev = data.chapters[idx - 1], next = data.chapters[idx + 1];
  $("pager").innerHTML = (prev ? `<a class="btn" href="chapter.html?ch=${prev.dir}">← ${prev.num} ${esc(prev.title)}</a>` : "<span></span>") +
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
      if (m) { a.href = `chapter.html?ch=${m[1]}`; return; }
      const path = new URL(href, `https://x/${ch.dir}/`).pathname.slice(1);
      a.href = `${REPO}/blob/main/${path}`;
    });
  } catch (e) {
    $("lesson").innerHTML = `<p class="err">Could not load the README (${esc(e.message)}).</p>`;
  }

  // ---------------- demo ----------------
  const kit = await text("assets/kit.js");
  const demoKey = `sdh:${ch.dir}:demo/demo.js`;
  let demoOriginal = "";
  try { demoOriginal = await text(base + "demo/demo.js"); } catch (e) { demoOriginal = `K.title("No demo yet"); K.note(${JSON.stringify(e.message)});`; }
  const src = $("demo-src");
  src.value = store.get(demoKey) ?? demoOriginal;
  const frame = $("frame");
  function runDemo() {
    const code = src.value;
    if (code !== demoOriginal) store.set(demoKey, code); else store.del(demoKey);
    $("demo-status").textContent = code !== demoOriginal ? "running your edited version" : "";
    $("demo-status").className = "status";
    const boot = `
      window.addEventListener("error", (e) => parent.postMessage({ type: "demo-error", msg: e.message + (e.lineno ? " (line " + e.lineno + ")" : "") }, "*"));
      window.addEventListener("unhandledrejection", (e) => parent.postMessage({ type: "demo-error", msg: String(e.reason) }, "*"));
      new ResizeObserver(() => parent.postMessage({ type: "demo-height", h: document.documentElement.scrollHeight }, "*")).observe(document.documentElement);`;
    const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body><div id="app"></div><script>${safe(boot)}<\/script><script>${safe(kit)}<\/script><script>${safe(code)}\n//# sourceURL=demo.js<\/script></body></html>`;
  }
  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow || !e.data) return;
    if (e.data.type === "demo-error") { $("demo-status").textContent = "Error: " + e.data.msg; $("demo-status").className = "status err"; }
    if (e.data.type === "demo-height") frame.style.height = Math.min(Math.max(e.data.h + 4, 320), 2400) + "px";
  });
  $("run").onclick = runDemo;
  $("edit").onclick = () => { $("demo-editor").classList.toggle("open"); $("edit").textContent = $("demo-editor").classList.contains("open") ? "Hide source" : "Edit source"; };
  $("reset").onclick = () => { src.value = demoOriginal; store.del(demoKey); runDemo(); };
  for (const ta of [src, $("py-src")]) {
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText("    ", s, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input")); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); ta === src ? runDemo() : runTests(); }
    });
  }
  runDemo();

  // ---------------- python ----------------
  const files = ch.python;
  const originals = {};
  const buffers = {};
  let current = null;
  if (!files.length) { $("py-panel").style.display = "none"; return; }
  await Promise.all(files.map(async (f) => { originals[f] = await text(base + f); buffers[f] = store.get(`sdh:${ch.dir}:${f}`) ?? originals[f]; }));
  const tabs = $("py-tabs"), py = $("py-src");
  function show(f) {
    current = f;
    py.value = buffers[f];
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.f === f));
  }
  py.addEventListener("input", () => {
    buffers[current] = py.value;
    if (py.value !== originals[current]) store.set(`sdh:${ch.dir}:${current}`, py.value); else store.del(`sdh:${ch.dir}:${current}`);
  });
  const ordered = [...files.filter((f) => !f.startsWith("tests/")), ...files.filter((f) => f.startsWith("tests/"))];
  tabs.innerHTML = ordered.map((f) => `<button data-f="${esc(f)}">${esc(f)}</button>`).join("");
  tabs.querySelectorAll("button").forEach((b) => (b.onclick = () => show(b.dataset.f)));
  show(ordered[0]);
  $("py-reset").onclick = () => { for (const f of files) { buffers[f] = originals[f]; store.del(`sdh:${ch.dir}:${f}`); } show(current); };

  let pyodide = null;
  async function getPyodide() {
    if (pyodide) return pyodide;
    $("py-status").textContent = "Loading Python (about 10 MB, first time only)…";
    await new Promise((res, rej) => { const s = document.createElement("script"); s.src = PYODIDE + "pyodide.js"; s.onload = res; s.onerror = () => rej(new Error("could not load Pyodide")); document.head.append(s); });
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
      p.runPython("import shutil, os\nshutil.rmtree('/work', ignore_errors=True)\nos.makedirs('/work/ch/tests', exist_ok=True)");
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
      $("py-status").textContent = passed ? "All tests pass. Copy your code back into the repo." : "Some tests fail (expected until you implement the stubs).";
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
