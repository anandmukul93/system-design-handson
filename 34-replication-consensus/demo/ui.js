// UI only: draws the Raft cluster and its messages, and a bar chart of shard sizes.
import { RaftCluster, MESSAGE_DELAY } from "./raft.js";
import { makeHashPartitioner, makeRangePartitioner, sampleKeys, countPerShard } from "./partitioning.js";

K.title(
  "Replication and consensus",
  "Five Raft nodes elect a leader. Kill the leader or partition the cluster; then compare hash and range sharding.",
);

const cluster = new RaftCluster(5, K.rng(34));

K.section("Raft cluster");
K.button(
  "Kill the leader",
  () => {
    const dead = cluster.killLeader();
    if (dead) log.add(`n${dead.id} (leader, term ${dead.term}) crashed`, "bad");
  },
  "danger",
);
K.button("Restart all", () => {
  cluster.restartAll();
  log.add("all nodes up", "ok");
});
K.button("Partition {n0,n1} | {n2,n3,n4}", (e) => {
  cluster.minoritySide = cluster.minoritySide ? null : new Set([0, 1]);
  e.target.textContent = cluster.minoritySide ? "Heal partition" : "Partition {n0,n1} | {n2,n3,n4}";
  log.add(
    cluster.minoritySide ? "network partitioned" : "partition healed",
    cluster.minoritySide ? "warn" : "ok",
  );
});
K.button("Client write", () => {
  const r = cluster.clientWrite();
  log.add(r.text, r.ok ? "ok" : "bad");
});
const cv = K.canvas(240, () => draw());
const log = K.log(110);

function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const count = cluster.nodes.length;
  const centerX = width / 2;
  const centerY = 115;
  const position = (i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return [centerX + 85 * Math.cos(angle), centerY + 85 * Math.sin(angle)];
  };
  const messageColor = { heartbeat: "c3", "request-vote": "c2", vote: "c5" };
  for (const m of cluster.messages) {
    const [x1, y1] = position(m.from);
    const [x2, y2] = position(m.to);
    const progress = m.age / MESSAGE_DELAY;
    ctx.fillStyle = K.color(messageColor[m.type]);
    ctx.beginPath();
    ctx.arc(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress, 4, 0, 7);
    ctx.fill();
  }
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  const roleColor = { leader: "c1", candidate: "c2", follower: "muted" };
  cluster.nodes.forEach((n, i) => {
    const [x, y] = position(i);
    ctx.fillStyle = K.color(n.up ? roleColor[n.role] : "line");
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(`n${i}`, x, y - 2);
    ctx.fillText(`t${n.term}`, x, y + 11);
    ctx.fillStyle = K.color("fg");
    ctx.fillText(n.up ? n.role : "down", x, y + 34);
  });
  if (cluster.minoritySide) {
    ctx.strokeStyle = K.color("bad");
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX - 10, 5);
    ctx.lineTo(centerX + 120, 230);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.textAlign = "start";
  ctx.fillStyle = K.color("muted");
  ctx.fillText("green dots: heartbeats · orange: vote requests · purple: votes", 6, 234);
}
K.loop(() => {
  for (const e of cluster.tick()) log.add(e.text, e.kind);
  draw();
}, 120);

// ---- partitioning ----
K.section("Hash vs range partitioning");
const PARTITIONERS = {
  "hash(key) % 4": makeHashPartitioner(K.hash),
  "range on key": makeRangePartitioner(),
};
const scheme = K.select("Scheme", Object.keys(PARTITIONERS), "hash(key) % 4", () => showShards());
const sequential = K.slider("Sequential keys written (e.g. timestamps)", 0, 400, 200, 10, () => showShards());
const bars = K.bars(130);
function showShards() {
  const keys = sampleKeys(sequential.value);
  const counts = countPerShard(keys, PARTITIONERS[scheme.value]);
  bars.draw(
    counts.map((v, i) => ({ label: "shard " + i, value: v, color: v > keys.length * 0.4 ? "bad" : i })),
  );
}
showShards();
