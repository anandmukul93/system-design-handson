// UI only: produce/consume sliders, broker kill buttons and a drawing of the partition logs.
import { byKey, roundRobin } from "./partitioner.js";
import { BrokerCluster } from "./broker_cluster.js";
import { ConsumerGroup } from "./consumer_group.js";

K.title(
  "Distributed message queue",
  "Producers append to partitions; a consumer group splits partitions and commits offsets. Remove a consumer or kill a broker.",
);

const BROKERS = ["b1", "b2", "b3"];
const cluster = new BrokerCluster(BROKERS, 4);
const group = new ConsumerGroup(cluster, ["c1", "c2", "c3"]);
let sequence = 0;

K.section("Controls");
const rate = K.slider("Produce rate (msg / tick)", 0, 10, 3, 1);
const keyed = K.toggle("Key by user id (ordering per key)", true);
const consumeRate = K.slider("Consume per consumer / tick", 0, 10, 3, 1);
const showAssignment = (a) =>
  log.add(
    `rebalance: ${Object.entries(a)
      .map(([p, m]) => `p${p}→${m}`)
      .join(", ")}`,
    "ok",
  );
K.button("Add consumer", () => showAssignment(group.join("c" + (group.members.length + 1))));
K.button("Remove a consumer", () => {
  const res = group.leave();
  if (!res) return;
  log.add(`${res.member} left the group`, "warn");
  showAssignment(res.assignment);
});
for (const b of BROKERS) {
  K.button(
    `kill ${b}`,
    (e) => {
      const nowUp = !cluster.up[b];
      e.target.textContent = `${nowUp ? "kill" : "restart"} ${b}`;
      for (const ev of cluster.setBroker(b, nowUp)) {
        if (ev.type === "failover")
          log.add(`p${ev.partition}: leader ${ev.from} down, ${ev.to} (in-sync) elected leader`, "warn");
        else if (ev.type === "offline")
          log.add(`p${ev.partition}: no in-sync replica, partition offline`, "bad");
        else log.add(`p${ev.partition} back online with leader ${ev.to}`, "ok");
      }
      draw();
    },
    "danger",
  );
}
const st = K.stats({
  produced: "Produced",
  consumed: "Consumed",
  lag: "Total lag",
  redeliv: "Re-delivered after rebalance",
});
const cv = K.canvas(cluster.partitions.length * 46 + 10, () => draw());
const log = K.log(100);

function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  cluster.partitions.forEach((p, i) => {
    const y = 8 + i * 46;
    const left = 130;
    const cell = 9;
    const visible = Math.floor((width - left - 10) / cell);
    const first = Math.max(0, p.log.length - visible);
    ctx.fillStyle = K.color("fg");
    ctx.fillText(`p${i}  leader ${p.leader || "NONE"}`, 4, y + 12);
    ctx.fillStyle = K.color("muted");
    ctx.fillText(`→ ${group.assignment[i]}  isr ${p.isr.join(",")}`, 4, y + 28);
    for (let offset = first; offset < p.log.length; offset++) {
      const committed = offset < group.committed[i];
      const readOnly = offset < group.read[i];
      ctx.fillStyle = K.color(committed ? "c3" : readOnly ? "c6" : K.hash(p.log[offset]) % 6);
      ctx.globalAlpha = committed ? 0.35 : 0.9;
      ctx.fillRect(left + (offset - first) * cell, y, cell - 1, 30);
    }
    ctx.globalAlpha = 1;
  });
  st.setAll({ produced: cluster.produced, consumed: group.consumed, redeliv: group.redelivered });
  st.set("lag", group.lag(), group.lag() > 100 ? "bad" : null);
}
showAssignment(group.assignment);
K.loop(() => {
  const partitioner = keyed.value ? byKey : roundRobin;
  for (let k = 0; k < rate.value; k++) {
    const key = "u" + Math.floor(Math.random() * 20);
    cluster.append(partitioner(key, sequence++, cluster.partitions.length), key);
  }
  group.poll(consumeRate.value, () => Math.random() < 0.5); // offsets are committed periodically, not per message
  draw();
}, 300);
