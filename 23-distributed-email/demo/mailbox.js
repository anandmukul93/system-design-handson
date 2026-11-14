// The mailbox: stores messages and groups them into threads using the In-Reply-To header.
export class Mailbox {
  constructor() {
    this.messages = []; // { id, from, subject, body, inReplyTo, threadId, read }
    this.byId = new Map();
    this.nextNumber = 1;
  }
  // a reply joins its parent's thread; anything else starts a new thread named after its own id
  deliver({ from, subject, body, inReplyTo = null }) {
    const id = `<m${this.nextNumber++}@mail>`;
    const parent = inReplyTo ? this.byId.get(inReplyTo) : null;
    const message = {
      id,
      from,
      subject,
      body,
      inReplyTo,
      threadId: parent ? parent.threadId : id,
      read: false,
    };
    this.messages.push(message);
    this.byId.set(id, message);
    return message;
  }
  // threads (arrays of messages), optionally restricted to a set of message ids
  threads(onlyIds = null) {
    const map = new Map();
    for (const m of this.messages) {
      if (onlyIds && !onlyIds.has(m.id)) continue;
      if (!map.has(m.threadId)) map.set(m.threadId, []);
      map.get(m.threadId).push(m);
    }
    return [...map.values()];
  }
  threadCount() {
    return new Set(this.messages.map((m) => m.threadId)).size;
  }
  unreadCount() {
    return this.messages.filter((m) => !m.read).length;
  }
}
