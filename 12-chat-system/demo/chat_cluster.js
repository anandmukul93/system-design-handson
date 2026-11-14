// Chat backend: users connect to one of two servers, messages get increasing ids, routing between servers
// goes over pub/sub, and offline devices catch up from their last seen id. Returns events; no UI.
export class ChatCluster {
  // users: { name: serverName }      groups: { groupName: [members] }
  constructor(users, groups) {
    this.users = users;
    this.groups = groups;
    const names = Object.keys(users);
    this.online = Object.fromEntries(names.map((u) => [u, true]));
    this.lastSeenId = Object.fromEntries(names.map((u) => [u, 0]));
    this.inbox = Object.fromEntries(names.map((u) => [u, []]));
    this.messages = []; // the message store: { id, from, to, text }
    this.nextId = 1;
    this.pubsubHops = 0;
  }

  // "#team" is a group; anything else is a 1:1 chat
  recipients(to, from) {
    const members = to.startsWith("#") ? this.groups[to.slice(1)] : [to];
    return [...new Set(members)].filter((u) => u !== from);
  }

  // returns { ok, message, events }
  send(from, to, text) {
    if (!this.online[from]) return { ok: false, events: [{ type: "sender-offline", user: from }] };
    const message = { id: this.nextId++, from, to, text };
    this.messages.push(message); // 1. persist first, with a monotonically increasing id
    const events = [];
    for (const user of this.recipients(to, from)) {
      // 2. route to the server each recipient is connected to
      if (this.users[user] !== this.users[from]) {
        this.pubsubHops++;
        events.push({ type: "pubsub", fromServer: this.users[from], toServer: this.users[user], user });
      }
      if (this.online[user]) this.deliver(user, message);
      else events.push({ type: "stored-for-offline", user });
    }
    return { ok: true, message, events };
  }

  deliver(user, message) {
    this.inbox[user].push(message);
    this.lastSeenId[user] = Math.max(this.lastSeenId[user], message.id);
  }

  disconnect(user) {
    this.online[user] = false;
  }

  // on reconnect the device asks for everything after its last seen id. Returns { since, missed }.
  reconnect(user) {
    this.online[user] = true;
    const since = this.lastSeenId[user];
    const missed = this.messages.filter((m) => m.id > since && this.recipients(m.to, m.from).includes(user));
    missed.forEach((m) => this.deliver(user, m));
    return { since, missed: missed.length };
  }
}
