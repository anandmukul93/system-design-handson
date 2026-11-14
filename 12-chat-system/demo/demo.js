// Chat: two servers, pub/sub routing, offline sync by last message id, heartbeat presence. Edit me and press Run.
K.title("Chat system", "Users are connected to chat server A or B. Messages route through pub/sub; offline devices sync from their last seen id.");

const USERS = { alice: "A", bob: "A", carol: "B", dave: "B" };
const GROUPS = { team: ["alice", "bob", "carol", "dave"], pair: ["alice", "carol"] };
const online = Object.fromEntries(Object.keys(USERS).map((u) => [u, true]));
const beating = Object.fromEntries(Object.keys(USERS).map((u) => [u, true]));
const lastBeat = Object.fromEntries(Object.keys(USERS).map((u) => [u, 0]));
const lastSeenId = Object.fromEntries(Object.keys(USERS).map((u) => [u, 0]));
const inbox = Object.fromEntries(Object.keys(USERS).map((u) => [u, []]));
const store = [];                     // message store: {id, from, to (user|group), text}
let nextId = 1, tick = 0, pubsub = 0;

K.section("Send");
const from = K.select("From", Object.keys(USERS), "alice");
const to = K.select("To", [...Object.keys(USERS), ...Object.keys(GROUPS).map((g) => "#" + g)], "carol");
const text = K.text("Message", "hi!", null, 160);
K.button("Send", send, "primary");
K.section("Devices");
for (const u of Object.keys(USERS)) {
  K.button(`${u}: disconnect`, (e) => { online[u] = !online[u]; e.target.textContent = `${u}: ${online[u] ? "disconnect" : "reconnect"}`; if (online[u]) sync(u); else log.add(`${u}'s websocket closed`, "warn"); render(); });
}
for (const u of Object.keys(USERS)) K.button(`${u}: stop heartbeat`, (e) => { beating[u] = !beating[u]; e.target.textContent = `${u}: ${beating[u] ? "stop" : "resume"} heartbeat`; });
const st = K.stats({ msgs: "Messages stored", pubsub: "Cross-server pub/sub hops" });
const table = K.table(["User", "Server", "Socket", "Presence", "Last seen id", "Inbox (latest)"]);
const log = K.log(130);

const recipients = (t, f) => (t.startsWith("#") ? GROUPS[t.slice(1)] : [t, f]).filter((u, i, a) => a.indexOf(u) === i && u !== f);
function send() {
  const f = from.value, t = to.value;
  if (!online[f]) return log.add(`${f} is offline and cannot send`, "bad");
  const m = { id: nextId++, from: f, to: t, text: text.value };
  store.push(m);                                         // 1. persist with a monotonically increasing id
  log.add(`${f}@${USERS[f]} → ${t}: "${m.text}" stored as id ${m.id}`, "ok");
  for (const r of recipients(t, f)) {                   // 2. route to each recipient's server
    if (USERS[r] !== USERS[f]) { pubsub++; log.add(`  server ${USERS[f]} publishes to channel of server ${USERS[r]} for ${r}`, "muted"); }
    if (online[r]) deliver(r, m); else log.add(`  ${r} offline: kept in store, will sync later`, "warn");
  }
  render();
}
function deliver(u, m) { inbox[u].push(m); lastSeenId[u] = Math.max(lastSeenId[u], m.id); }
function sync(u) {
  const prev = lastSeenId[u];
  const missed = store.filter((m) => m.id > lastSeenId[u] && recipients(m.to, m.from).includes(u));
  missed.forEach((m) => deliver(u, m));
  log.add(`${u} reconnected: fetched ${missed.length} messages with id > ${prev}`, "ok");
}
function render() {
  table.set(Object.keys(USERS).map((u) => {
    const pres = online[u] && tick - lastBeat[u] <= 5;
    return [u, USERS[u], online[u] ? "open" : "closed", K.chip(pres ? "online" : "offline", pres ? "ok" : "bad"), lastSeenId[u], inbox[u].slice(-2).map((m) => `#${m.id} ${m.from}: ${m.text}`).join(" · ") || "–"];
  }));
  st.setAll({ msgs: store.length, pubsub });
}
K.loop(() => {
  tick++;
  for (const u of Object.keys(USERS)) {
    const was = tick - 1 - lastBeat[u] <= 5;
    if (online[u] && beating[u]) lastBeat[u] = tick;
    if (was && tick - lastBeat[u] > 5) log.add(`no heartbeat from ${u} for 5 s: presence → offline`, "warn");
  }
  render();
}, 1000);
render();
