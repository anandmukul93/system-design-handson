// Mailbox with threading and an inverted index. Edit me and press Run.
K.title(
  "Email: threading and search",
  "Mail arrives; replies thread by In-Reply-To, unread counts update, and each message is tokenized into an inverted index.",
);

const SUBJ = [
  "Quarterly report",
  "Lunch on Friday?",
  "Server outage postmortem",
  "Design review: cache layer",
  "Invoice #4411",
];
const BODY = [
  "please review the attached numbers",
  "the cache hit ratio dropped after deploy",
  "can we move the meeting to friday",
  "root cause was a bad config push",
  "payment due in thirty days",
  "looks good, ship it",
  "I disagree about the TTL",
];
const FROM = ["ana", "ben", "chen", "dev", "eve"];
const msgs = [],
  index = new Map();
let nextId = 1,
  selected = null;
const rnd = K.rng(23);

K.section("Mail");
K.button("Receive mail", () => receive(), "primary");
const auto = K.toggle("Auto-deliver", true);
const search = K.text("Search", "", () => render(), 200);
const st = K.stats({
  msgs: "Messages",
  threads: "Threads",
  unread: "Unread",
  terms: "Index terms",
  postings: "Postings",
});
const table = K.table(["Thread", "From", "Messages", "Unread", ""]);
K.section("Inverted index (latest terms)");
const idx = K.code("");
const log = K.log(70);

const tokens = (s) => s.toLowerCase().match(/[a-z0-9#]+/g) || [];
function receive() {
  const reply = msgs.length && rnd() < 0.55 ? msgs[Math.floor(rnd() * msgs.length)] : null;
  const m = {
    id: `<m${nextId++}@mail>`,
    from: FROM[Math.floor(rnd() * FROM.length)],
    subject: reply ? "Re: " + reply.subject.replace(/^Re: /, "") : SUBJ[Math.floor(rnd() * SUBJ.length)],
    body: BODY[Math.floor(rnd() * BODY.length)],
    inReplyTo: reply ? reply.id : null,
    read: false,
  };
  m.thread = reply ? reply.thread : m.id; // thread root = first message's id
  msgs.push(m);
  for (const t of new Set(tokens(m.subject + " " + m.body + " " + m.from))) {
    if (!index.has(t)) index.set(t, []);
    index.get(t).push(m.id);
  }
  log.add(`${m.id} from ${m.from}: "${m.subject}"${reply ? ` (In-Reply-To ${reply.id})` : ""}`, "muted");
  render();
}
function render() {
  const q = tokens(search.value);
  let hits = null;
  for (const t of q) {
    const p = new Set(index.get(t) || []);
    hits = hits ? new Set([...hits].filter((x) => p.has(x))) : p;
  } // AND of postings lists
  const threads = new Map();
  for (const m of msgs)
    if (!hits || hits.has(m.id)) {
      if (!threads.has(m.thread)) threads.set(m.thread, []);
      threads.get(m.thread).push(m);
    }
  table.set(
    [...threads.values()]
      .reverse()
      .slice(0, 8)
      .map((ms) => {
        const unread = ms.filter((m) => !m.read).length;
        return [
          ms[0].subject.replace(/^Re: /, ""),
          [...new Set(ms.map((m) => m.from))].join(", "),
          ms.length,
          unread ? K.chip(unread, "c1") : "0",
          K.h(
            "button",
            {
              class: "k-btn",
              onclick: () => {
                ms.forEach((m) => (m.read = true));
                render();
              },
            },
            "open",
          ),
        ];
      }),
  );
  const allThreads = new Set(msgs.map((m) => m.thread));
  st.setAll({
    msgs: msgs.length,
    threads: allThreads.size,
    unread: msgs.filter((m) => !m.read).length,
    terms: index.size,
    postings: [...index.values()].reduce((a, p) => a + p.length, 0),
  });
  idx.set(
    (q.length ? q : [...index.keys()].slice(-10))
      .map((t) => `${t.padEnd(12)} → ${(index.get(t) || []).join(" ")}`)
      .join("\n") + (q.length ? `\n\nAND → ${hits ? hits.size : 0} messages` : ""),
  );
}
for (let i = 0; i < 6; i++) receive();
K.loop(() => auto.value && receive(), 2500);
