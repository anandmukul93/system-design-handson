(async function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let data;
  try {
    data = await (await fetch("data/site.json")).json();
  } catch (e) {
    document.getElementById("phases").innerHTML = '<p class="err">Could not load data/site.json. Run <code>make site</code> from the repo root.</p>';
    return;
  }
  const byId = Object.fromEntries(data.concepts.map((c) => [c.id, c]));
  const byNum = Object.fromEntries(data.chapters.map((c) => [c.num, c]));
  const count = (s) => data.concepts.filter((c) => c.status === s).length;

  document.getElementById("kpis").innerHTML = [
    [data.chapters.length, "chapters with live demos"],
    [data.concepts.length, "concepts mapped"],
    [count("covered"), "covered in 01-28"],
    [count("deepened") + count("new"), "deepened or added in 29-51"],
  ].map(([n, l]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join("");

  document.getElementById("phases").innerHTML = data.phases.map((p) => {
    const chs = data.chapters.filter((c) => c.phase === p.id);
    if (!chs.length) return "";
    return `<div class="phase"><h3>Phase ${p.id}: ${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="cards">${chs.map((c) => `
      <a class="card" href="chapter.html?ch=${encodeURIComponent(c.dir)}">
        <span class="num">${c.num} · ${esc(c.effort)}</span>
        <span class="t">${esc(c.title)}</span>
        <span class="s">${esc(c.short)}</span>
        <span class="chips">${c.concepts.slice(0, 6).map((id) => `<span class="chip ${byId[id].status}">${esc(byId[id].name)}</span>`).join("")}${c.concepts.length > 6 ? `<span class="chip">+${c.concepts.length - 6}</span>` : ""}</span>
      </a>`).join("")}</div></div>`;
  }).join("");

  const tbody = document.getElementById("matrix");
  const q = document.getElementById("q"), st = document.getElementById("st");
  function render() {
    const term = q.value.trim().toLowerCase(), s = st.value;
    const rows = data.concepts.filter((c) => (!s || c.status === s) && (!term || c.name.toLowerCase().includes(term) ||
      c.chapters.some((n) => byNum[n].title.toLowerCase().includes(term))));
    tbody.innerHTML = rows.map((c) => `<tr><td>${c.id}</td><td>${esc(c.name)}</td><td><span class="chip ${c.status}">${c.status}</span></td>
      <td>${c.chapters.map((n) => `<a href="chapter.html?ch=${encodeURIComponent(byNum[n].dir)}">${n} ${esc(byNum[n].title)}</a>`).join("<br>")}</td></tr>`).join("")
      || '<tr><td colspan="4">No concepts match.</td></tr>';
  }
  q.addEventListener("input", render);
  st.addEventListener("change", render);
  render();
})();
