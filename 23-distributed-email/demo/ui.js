// UI only: an inbox table, a search box and a view of the inverted index.
import { Mailbox } from "./mailbox.js";
import { InvertedIndex, tokenize } from "./inverted_index.js";
import { nextMail } from "./mail_generator.js";

K.title(
  "Email: threading and search",
  "Mail arrives; replies thread by In-Reply-To, unread counts update, and each message is tokenized into an inverted index.",
);

const random = K.rng(23);
const mailbox = new Mailbox();
const index = new InvertedIndex();

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
const indexView = K.code("");
const log = K.log(70);

function receive() {
  const m = mailbox.deliver(nextMail(mailbox.messages, random));
  index.add(m.id, `${m.subject} ${m.body} ${m.from}`);
  log.add(
    `${m.id} from ${m.from}: "${m.subject}"${m.inReplyTo ? ` (In-Reply-To ${m.inReplyTo})` : ""}`,
    "muted",
  );
  render();
}
function render() {
  const hits = index.search(search.value);
  const threads = mailbox.threads(hits).reverse().slice(0, 8);
  table.set(
    threads.map((messages) => {
      const unread = messages.filter((m) => !m.read).length;
      const open = () => {
        messages.forEach((m) => (m.read = true));
        render();
      };
      return [
        messages[0].subject.replace(/^Re: /, ""),
        [...new Set(messages.map((m) => m.from))].join(", "),
        messages.length,
        unread ? K.chip(unread, "c1") : "0",
        K.h("button", { class: "k-btn", onclick: open }, "open"),
      ];
    }),
  );
  st.setAll({
    msgs: mailbox.messages.length,
    threads: mailbox.threadCount(),
    unread: mailbox.unreadCount(),
    terms: index.termCount(),
    postings: index.postingCount(),
  });
  const queryTerms = tokenize(search.value);
  const shown = queryTerms.length ? queryTerms : [...index.postings.keys()].slice(-10);
  const lines = shown.map((term) => `${term.padEnd(12)} → ${(index.postings.get(term) || []).join(" ")}`);
  if (queryTerms.length) lines.push("", `AND → ${hits ? hits.size : 0} messages`);
  indexView.set(lines.join("\n"));
}
for (let i = 0; i < 6; i++) receive();
K.loop(() => auto.value && receive(), 2500);
