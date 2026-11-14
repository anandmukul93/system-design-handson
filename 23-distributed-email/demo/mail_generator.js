// Generates plausible incoming mail, about half of it replies to earlier messages.
const SUBJECTS = [
  "Quarterly report",
  "Lunch on Friday?",
  "Server outage postmortem",
  "Design review: cache layer",
  "Invoice #4411",
];
const BODIES = [
  "please review the attached numbers",
  "the cache hit ratio dropped after deploy",
  "can we move the meeting to friday",
  "root cause was a bad config push",
  "payment due in thirty days",
  "looks good, ship it",
  "I disagree about the TTL",
];
const SENDERS = ["ana", "ben", "chen", "dev", "eve"];
const pick = (list, random) => list[Math.floor(random() * list.length)];

export function nextMail(existingMessages, random) {
  const parent = existingMessages.length && random() < 0.55 ? pick(existingMessages, random) : null;
  return {
    from: pick(SENDERS, random),
    subject: parent ? "Re: " + parent.subject.replace(/^Re: /, "") : pick(SUBJECTS, random),
    body: pick(BODIES, random),
    inReplyTo: parent ? parent.id : null,
  };
}
