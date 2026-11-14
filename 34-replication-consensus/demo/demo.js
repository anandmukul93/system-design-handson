// Raft leader election + hash vs range partitioning. Edit me and press Run.
K.title("Replication and consensus", "Five Raft nodes elect a leader. Kill the leader or partition the cluster; then compare hash and range sharding.");

const NODES = 5, rnd = K.rng(34);
const nodes = Array.from({ length: NODES }, (_, i) => ({ id: i, term: 0, role: "follower", votedFor: null, timer: 0, up: true, votes: 0, log: 0 }));
const resetTimer = (n) => (n.timer = 15 + Math.floor(rnd() * 15));      // randomized election timeout (ticks)
nodes.forEach(resetTimer);
let partition = null;                                                      // set of node ids on the minority side
const canTalk = (a, b) => a.up && b.up && (!partition || partition.has(a.id) === partition.has(b.id));
const msgs = [];

K.section("Raft cluster");
K.button("Kill the leader", () => { const l = nodes.find((n) => n.role === "leader" && n.up); if (l) { l.up = false; log.add(`n${l.id} (leader, term ${l.term}) crashed`, "bad"); } }, "danger");
K.button("Restart all", () => { nodes.forEach((n) => { if (!n.up) { n.up = true; n.role = "follower"; resetTimer(n); } }); log.add("all nodes up", "ok"); });
K.button("Partition {n0,n1} | {n2,n3,n4}", (e) => { partition = partition ? null : new Set([0, 1]); e.target.textContent = partition ? "Heal partition" : "Partition {n0,n1} | {n2,n3,n4}"; log.add(partition ? "network partitioned" : "partition healed", partition ? "warn" : "ok"); });
K.button("Client write", () => { const l = nodes.find((n) => n.role === "leader" && n.up); if (!l) return log.add("no leader: write rejected", "bad"); const acks = nodes.filter((n) => canTalk(l, n)).length; if (acks > NODES / 2) { nodes.filter((n) => canTalk(l, n)).forEach((n) => n.log++); log.add(`n${l.id} committed entry: ${acks}/${NODES} replicas (majority)`, "ok"); } else log.add(`n${l.id} only reaches ${acks}/${NODES}: cannot commit`, "bad"); });
const cv = K.canvas(240, () => draw());
const log = K.log(110);

function send(from, to, type, extra = {}) { if (canTalk(from, to)) msgs.push({ from: from.id, to: to.id, type, term: from.term, t: 0, ...extra }); }
function tick() {
  for (const n of nodes) {
    if (!n.up) continue;
    if (n.role === "leader") { if (--n.timer <= 0) { nodes.forEach((m) => m !== n && send(n, m, "heartbeat")); n.timer = 5; } continue; }
    if (--n.timer <= 0) {
      n.term++; n.role = "candidate"; n.votedFor = n.id; n.votes = 1; resetTimer(n);
      log.add(`n${n.id} timed out → candidate for term ${n.term}`, "warn");
      nodes.forEach((m) => m !== n && send(n, m, "vote?", { log: n.log }));
    }
  }
  for (const m of msgs) m.t++;
  for (const m of msgs.filter((x) => x.t >= 4)) {
    msgs.splice(msgs.indexOf(m), 1);
    const to = nodes[m.to], from = nodes[m.from];
    if (!to.up) continue;
    if (m.term > to.term) { to.term = m.term; to.role = "follower"; to.votedFor = null; }
    if (m.type === "heartbeat" && m.term >= to.term) { to.role = "follower"; resetTimer(to); }
    if (m.type === "vote?" && m.term >= to.term && (to.votedFor === null || to.votedFor === m.from) && m.log >= to.log) { to.votedFor = m.from; resetTimer(to); send(to, from, "vote!"); }
    if (m.type === "vote!" && to.role === "candidate" && m.term === to.term) {
      if (++to.votes > NODES / 2) { to.role = "leader"; to.timer = 0; log.add(`n${to.id} wins term ${to.term} with ${to.votes} votes`, "ok"); }
    }
  }
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear();
  const cx = width / 2, cy = 115, r = 85, pos = (i) => [cx + r * Math.cos((i / NODES) * 2 * Math.PI - Math.PI / 2), cy + r * Math.sin((i / NODES) * 2 * Math.PI - Math.PI / 2)];
  for (const m of msgs) { const [x1, y1] = pos(m.from), [x2, y2] = pos(m.to), f = m.t / 4; ctx.fillStyle = K.color(m.type === "heartbeat" ? "c3" : m.type === "vote?" ? "c2" : "c5"); ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, 4, 0, 7); ctx.fill(); }
  ctx.font = "11px system-ui"; ctx.textAlign = "center";
  nodes.forEach((n, i) => {
    const [x, y] = pos(i);
    ctx.fillStyle = K.color(!n.up ? "line" : n.role === "leader" ? "c1" : n.role === "candidate" ? "c2" : "muted");
    ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(`n${i}`, x, y - 2); ctx.fillText(`t${n.term}`, x, y + 11);
    ctx.fillStyle = K.color("fg"); ctx.fillText(!n.up ? "down" : n.role, x, y + 34);
  });
  if (partition) { ctx.strokeStyle = K.color("bad"); ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(cx - 10, 5); ctx.lineTo(cx + 120, 230); ctx.stroke(); ctx.setLineDash([]); }
  ctx.textAlign = "start"; ctx.fillStyle = K.color("muted"); ctx.fillText("green dots: heartbeats · orange: vote requests · purple: votes", 6, 234);
}
K.loop(tick, 120);

// ---- partitioning ----
K.section("Hash vs range partitioning");
const scheme = K.select("Scheme", ["hash(key) % 4", "range on key"], "hash(key) % 4", () => shards());
const hot = K.slider("Sequential keys written (e.g. timestamps)", 0, 400, 200, 10, () => shards());
const bars = K.bars(130);
function shards() {
  const counts = [0, 0, 0, 0];
  const keys = [...Array.from({ length: 200 }, (_, i) => "user" + ((i * 7919) % 1000)), ...Array.from({ length: hot.value }, (_, i) => "z-ts-" + String(1000 + i))];
  for (const k of keys) {
    if (scheme.value.startsWith("hash")) counts[K.hash(k) % 4]++;
    else counts[k < "user250" ? 0 : k < "user500" ? 1 : k < "user750" ? 2 : 3]++;    // fixed split points
  }
  bars.draw(counts.map((v, i) => ({ label: "shard " + i, value: v, color: v > keys.length * 0.4 ? "bad" : i })));
}
shards();
