// UI only: send form, device buttons and a status table for ChatCluster and Presence.
import { ChatCluster } from "./chat_cluster.js";
import { Presence } from "./presence.js";

K.title(
  "Chat system",
  "Users are connected to chat server A or B. Messages route through pub/sub; offline devices sync from their last seen id.",
);

const USERS = { alice: "A", bob: "A", carol: "B", dave: "B" };
const GROUPS = { team: ["alice", "bob", "carol", "dave"], pair: ["alice", "carol"] };
const names = Object.keys(USERS);
const chat = new ChatCluster(USERS, GROUPS);
const presence = new Presence(names, 5);
const heartbeatOn = Object.fromEntries(names.map((u) => [u, true]));

K.section("Send");
const from = K.select("From", names, "alice");
const to = K.select("To", [...names, ...Object.keys(GROUPS).map((g) => "#" + g)], "carol");
const text = K.text("Message", "hi!", null, 160);
K.button("Send", send, "primary");

K.section("Devices");
for (const u of names) {
  K.button(`${u}: disconnect`, (e) => {
    if (chat.online[u]) {
      chat.disconnect(u);
      log.add(`${u}'s websocket closed`, "warn");
    } else {
      const { since, missed } = chat.reconnect(u);
      log.add(`${u} reconnected: fetched ${missed} messages with id > ${since}`, "ok");
    }
    e.target.textContent = `${u}: ${chat.online[u] ? "disconnect" : "reconnect"}`;
    render();
  });
}
for (const u of names) {
  K.button(`${u}: stop heartbeat`, (e) => {
    heartbeatOn[u] = !heartbeatOn[u];
    e.target.textContent = `${u}: ${heartbeatOn[u] ? "stop" : "resume"} heartbeat`;
  });
}
const st = K.stats({ msgs: "Messages stored", pubsub: "Cross-server pub/sub hops" });
const table = K.table(["User", "Server", "Socket", "Presence", "Last seen id", "Inbox (latest)"]);
const log = K.log(130);

function send() {
  const res = chat.send(from.value, to.value, text.value);
  if (!res.ok) return log.add(`${from.value} is offline and cannot send`, "bad");
  const m = res.message;
  log.add(`${m.from}@${USERS[m.from]} → ${m.to}: "${m.text}" stored as id ${m.id}`, "ok");
  for (const e of res.events) {
    if (e.type === "pubsub")
      log.add(`  server ${e.fromServer} publishes to channel of server ${e.toServer} for ${e.user}`, "muted");
    else log.add(`  ${e.user} offline: kept in store, will sync later`, "warn");
  }
  render();
}
function render() {
  table.set(
    names.map((u) => {
      const present = chat.online[u] && presence.isOnline(u);
      const latest = chat.inbox[u].slice(-2).map((m) => `#${m.id} ${m.from}: ${m.text}`);
      return [
        u,
        USERS[u],
        chat.online[u] ? "open" : "closed",
        K.chip(present ? "online" : "offline", present ? "ok" : "bad"),
        chat.lastSeenId[u],
        latest.join(" · ") || "–",
      ];
    }),
  );
  st.setAll({ msgs: chat.messages.length, pubsub: chat.pubsubHops });
}
K.loop(() => {
  const beating = names.filter((u) => chat.online[u] && heartbeatOn[u]);
  for (const u of presence.step(beating))
    log.add(`no heartbeat from ${u} for 5 s: presence → offline`, "warn");
  render();
}, 1000);
render();
