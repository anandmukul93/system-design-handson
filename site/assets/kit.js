/* Demo kit: tiny helpers every chapter demo uses inside its sandboxed iframe.
 * Everything hangs off the global `K`. Controls are laid out in rows inside the current section.
 *
 *   K.title("Rate limiter", "subtitle")
 *   K.section("Controls")
 *   const rate = K.slider("Requests/s", 1, 50, 10)
 *   K.button("Fire", () => ...)
 *   const chart = K.chart([{ name: "allowed" }, { name: "rejected" }])
 *   K.loop(() => chart.push(a, r), 100)
 */
(function () {
  const css = `
  :root{--bg:#ffffff;--panel:#f6f7f9;--fg:#1b1f24;--muted:#5b6470;--line:#dde1e6;--accent:#2f6fde;
    --c1:#2f6fde;--c2:#e07b39;--c3:#2a9d6f;--c4:#c0458a;--c5:#8a63d2;--c6:#c49a1a;--ok:#2a9d6f;--bad:#d64545;--warn:#c98a12;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  @media (prefers-color-scheme:dark){:root{--bg:#14171c;--panel:#1c2027;--fg:#e6e9ee;--muted:#9aa4b1;--line:#2d333c;--accent:#6ea0ff;
    --c1:#6ea0ff;--c2:#f29a5c;--c3:#4cc392;--c4:#e173ad;--c5:#a98bf0;--c6:#e0bb45;--ok:#4cc392;--bad:#f07070;--warn:#e3a93a}}
  *{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 var(--sans)}
  #app{padding:14px;max-width:1100px;margin:0 auto}
  h1.k-title{font-size:18px;margin:0 0 2px}p.k-sub{margin:0 0 12px;color:var(--muted)}
  .k-section{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px;margin:0 0 12px}
  .k-section>h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:0 0 8px}
  .k-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end;margin:0 0 10px}
  .k-ctl{display:flex;flex-direction:column;gap:3px;min-width:140px;font-size:12px;color:var(--muted)}
  .k-ctl b{color:var(--fg);font-weight:600}
  input[type=range]{width:160px;accent-color:var(--accent)}
  select,input[type=text],input[type=number],textarea{background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:5px 7px;font:13px var(--sans)}
  textarea{font-family:var(--mono);width:100%}
  button.k-btn{background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:7px;padding:6px 12px;font:13px var(--sans);cursor:pointer}
  button.k-btn:hover{border-color:var(--accent)}button.k-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
  button.k-btn.danger{border-color:var(--bad);color:var(--bad)}
  .k-toggle{flex-direction:row;align-items:center;gap:6px;min-width:0;color:var(--fg);font-size:13px}
  .k-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin:0 0 10px}
  .k-stat{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:7px 9px}
  .k-stat span{display:block;font-size:11px;color:var(--muted)}.k-stat b{font-size:18px;font-variant-numeric:tabular-nums}
  .k-log{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font:12px/1.5 var(--mono);overflow:auto;margin:0 0 10px}
  .k-log div{white-space:pre-wrap}.k-log .ok{color:var(--ok)}.k-log .bad{color:var(--bad)}.k-log .warn{color:var(--warn)}.k-log .muted{color:var(--muted)}
  canvas.k-canvas{display:block;width:100%;background:var(--bg);border:1px solid var(--line);border-radius:8px;margin:0 0 10px}
  table.k-table{width:100%;border-collapse:collapse;font-size:12.5px;margin:0 0 10px;background:var(--bg)}
  .k-table th,.k-table td{border-bottom:1px solid var(--line);padding:4px 6px;text-align:left;font-variant-numeric:tabular-nums}
  .k-table th{color:var(--muted);font-weight:600}
  .k-note{color:var(--muted);font-size:12.5px;margin:0 0 10px}
  pre.k-code{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px;font:12px/1.5 var(--mono);overflow:auto;margin:0 0 10px;white-space:pre-wrap;word-break:break-all}
  .k-chip{display:inline-block;padding:1px 7px;border-radius:999px;border:1px solid var(--line);font-size:11.5px;margin:0 4px 4px 0}
  @media (max-width:560px){#app{padding:10px}input[type=range]{width:130px}.k-ctl{min-width:120px}}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const app = document.getElementById("app") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "app" }));
  const loops = [];
  const resizers = [];

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }

  const K = {
    app, h,
    cur: app,
    title(text, sub) {
      app.append(h("h1", { class: "k-title" }, text));
      if (sub) app.append(h("p", { class: "k-sub" }, sub));
    },
    section(title) {
      const el = h("section", { class: "k-section" }, title ? h("h2", {}, title) : null);
      app.append(el);
      K.cur = el;
      return el;
    },
    _row() {
      const last = K.cur.lastElementChild;
      if (last && last.classList.contains("k-row")) return last;
      const r = h("div", { class: "k-row" });
      K.cur.append(r);
      return r;
    },
    _place(el) { K.cur.append(el); return el; },
    slider(label, min, max, value, step = 1, onInput, fmt = (v) => v) {
      const out = h("b", {}, fmt(value));
      const inp = h("input", { type: "range", min, max, step, value });
      const obj = { el: inp, get value() { return Number(inp.value); }, set value(v) { inp.value = v; out.textContent = fmt(Number(v)); } };
      inp.addEventListener("input", () => { out.textContent = fmt(Number(inp.value)); onInput && onInput(Number(inp.value)); });
      K._row().append(h("label", { class: "k-ctl" }, h("span", {}, label, ": ", out), inp));
      return obj;
    },
    button(label, onClick, kind = "") {
      const b = h("button", { class: "k-btn " + kind, onclick: onClick }, label);
      K._row().append(b);
      return b;
    },
    select(label, options, value, onChange) {
      const opts = options.map((o) => (typeof o === "object" ? o : { value: o, label: o }));
      const s = h("select", {}, opts.map((o) => h("option", { value: o.value, selected: String(o.value) === String(value) }, o.label)));
      s.addEventListener("change", () => onChange && onChange(s.value));
      K._row().append(h("label", { class: "k-ctl" }, label, s));
      return { el: s, get value() { return s.value; }, set value(v) { s.value = v; } };
    },
    toggle(label, value, onChange) {
      const c = h("input", { type: "checkbox", checked: !!value });
      c.addEventListener("change", () => onChange && onChange(c.checked));
      K._row().append(h("label", { class: "k-ctl k-toggle" }, c, label));
      return { el: c, get value() { return c.checked; }, set value(v) { c.checked = !!v; } };
    },
    text(label, value = "", onInput, width = 220) {
      const i = h("input", { type: "text", value, style: { width: width + "px" } });
      i.addEventListener("input", () => onInput && onInput(i.value));
      K._row().append(h("label", { class: "k-ctl" }, label, i));
      return { el: i, get value() { return i.value; }, set value(v) { i.value = v; } };
    },
    textarea(value = "", rows = 6) {
      const t = h("textarea", { rows }, value);
      K._place(t);
      return { el: t, get value() { return t.value; }, set value(v) { t.value = v; } };
    },
    stats(defs) {
      const grid = h("div", { class: "k-stats" });
      const vals = {};
      for (const [k, label] of Object.entries(defs)) {
        const b = h("b", {}, "–");
        vals[k] = b;
        grid.append(h("div", { class: "k-stat" }, h("span", {}, label), b));
      }
      K._place(grid);
      return {
        set(k, v, color) { vals[k].textContent = v; vals[k].style.color = color ? K.color(color) : ""; },
        setAll(obj) { for (const [k, v] of Object.entries(obj)) this.set(k, v); },
      };
    },
    log(height = 140, max = 200) {
      const el = h("div", { class: "k-log", style: { height: height + "px" } });
      K._place(el);
      return {
        el,
        add(msg, kind = "") {
          el.append(h("div", { class: kind }, msg));
          while (el.childElementCount > max) el.firstChild.remove();
          el.scrollTop = el.scrollHeight;
        },
        clear() { el.textContent = ""; },
      };
    },
    canvas(height = 260, onResize) {
      const c = h("canvas", { class: "k-canvas", style: { height: height + "px" } });
      K._place(c);
      const ctx = c.getContext("2d");
      const obj = { el: c, ctx, width: 0, height, clear() { ctx.clearRect(0, 0, obj.width, obj.height); } };
      const fit = (initial) => {
        const dpr = window.devicePixelRatio || 1;
        obj.width = c.clientWidth || 600;
        c.width = Math.round(obj.width * dpr);
        c.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (initial !== true && onResize) onResize(obj);
      };
      fit(true);
      resizers.push(fit);
      return obj;
    },
    chart(series, opts = {}) {
      const height = opts.height || 180, points = opts.points || 120;
      const data = series.map(() => []);
      const cv = K.canvas(height, () => draw());
      function draw() {
        const { ctx, width } = cv;
        cv.clear();
        const pad = { l: 38, r: 8, t: 20, b: 16 };
        const all = data.flat();
        const max = opts.max ?? Math.max(1, ...all) * 1.1;
        const min = opts.min ?? 0;
        const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
        ctx.font = "11px system-ui";
        ctx.strokeStyle = K.color("line"); ctx.fillStyle = K.color("muted"); ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = pad.t + (H * i) / 4;
          ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + W, y); ctx.stroke();
          const v = max - ((max - min) * i) / 4;
          ctx.fillText(K.fmt(v), 2, y + 4);
        }
        let lx = pad.l;
        series.forEach((s, i) => {
          const col = K.color(s.color || i);
          ctx.strokeStyle = col; ctx.lineWidth = 2;
          ctx.beginPath();
          data[i].forEach((v, j) => {
            const x = pad.l + (W * j) / (points - 1);
            const y = pad.t + H - ((v - min) / (max - min || 1)) * H;
            j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
          ctx.fillStyle = col; ctx.fillRect(lx, 5, 10, 10);
          ctx.fillStyle = K.color("fg"); ctx.fillText(s.name, lx + 14, 14);
          lx += ctx.measureText(s.name).width + 32;
        });
      }
      return {
        push(...vals) { vals.forEach((v, i) => { data[i].push(v); if (data[i].length > points) data[i].shift(); }); draw(); },
        set(arrays) { arrays.forEach((a, i) => (data[i] = a.slice(-points))); draw(); },
        reset() { data.forEach((d) => (d.length = 0)); draw(); },
        draw,
      };
    },
    bars(height = 180) {
      let last = [[], null];
      const cv = K.canvas(height, () => draw(...last));
      function draw(items, maxV) {
        last = [items, maxV];
        const { ctx, width } = cv;
        cv.clear();
        if (!items.length) return;
        const max = maxV ?? Math.max(1, ...items.map((i) => i.value));
        const pad = 22, bw = (width - 10) / items.length;
        ctx.font = "11px system-ui"; ctx.textAlign = "center";
        items.forEach((it, i) => {
          const bh = ((height - pad * 2) * it.value) / max;
          const x = 5 + i * bw;
          ctx.fillStyle = K.color(it.color ?? 0);
          ctx.fillRect(x + bw * 0.12, height - pad - bh, bw * 0.76, bh);
          ctx.fillStyle = K.color("fg");
          ctx.fillText(it.label, x + bw / 2, height - 6);
          ctx.fillText(K.fmt(it.value), x + bw / 2, height - pad - bh - 4);
        });
        ctx.textAlign = "start";
      }
      return { draw: (items, max) => draw(items, max), el: cv.el };
    },
    table(columns) {
      const tb = h("tbody");
      const t = h("table", { class: "k-table" }, h("thead", {}, h("tr", {}, columns.map((c) => h("th", {}, c)))), tb);
      K._place(t);
      return {
        el: t,
        set(rows) {
          tb.textContent = "";
          for (const r of rows) tb.append(h("tr", {}, r.map((c) => h("td", {}, c instanceof Node ? c : String(c)))));
        },
      };
    },
    note(text) { return K._place(h("p", { class: "k-note" }, text)); },
    code(text = "") {
      const p = h("pre", { class: "k-code" }, text);
      K._place(p);
      return { el: p, set(t) { p.textContent = t; } };
    },
    chip(text, color) {
      return h("span", { class: "k-chip", style: color ? { borderColor: K.color(color), color: K.color(color) } : {} }, text);
    },
    loop(fn, ms = 100) {
      const l = { id: null, running: false,
        start() { if (!l.running) { l.running = true; l.id = setInterval(fn, ms); } return l; },
        stop() { clearInterval(l.id); l.running = false; return l; },
        toggle() { return l.running ? l.stop() : l.start(); } };
      loops.push(l);
      return l.start();
    },
    stopAll() { loops.forEach((l) => l.stop()); },
    rng(seed = 1) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    color(c) {
      const names = ["c1", "c2", "c3", "c4", "c5", "c6"];
      const key = typeof c === "number" ? names[c % names.length] : c;
      return getComputedStyle(document.documentElement).getPropertyValue("--" + key).trim() || key;
    },
    fmt(n, d) {
      if (typeof n !== "number" || !isFinite(n)) return String(n);
      if (d !== undefined) return n.toFixed(d);
      const a = Math.abs(n);
      if (a >= 1e9) return (n / 1e9).toFixed(1) + "B";
      if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
      if (a >= 1e4) return (n / 1e3).toFixed(1) + "k";
      if (a >= 100 || Number.isInteger(n)) return String(Math.round(n));
      return n.toFixed(a >= 1 ? 1 : a >= 0.01 ? 2 : 4);
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    loadScript(src) {
      return new Promise((res, rej) => {
        const s = h("script", { src });
        s.onload = res; s.onerror = () => rej(new Error("failed to load " + src));
        document.head.append(s);
      });
    },
    hash(str) {   // FNV-1a, 32-bit
      let x = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
      return x >>> 0;
    },
  };
  window.addEventListener("resize", () => resizers.forEach((f) => f()));
  window.K = K;
})();
