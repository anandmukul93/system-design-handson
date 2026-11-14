// The server side: a stream of numbered events, kept in a bounded backlog so clients can resume by id.
export class EventStream {
  constructor(keep = 500) {
    this.keep = keep;
    this.backlog = []; // { id, at }
    this.nextId = 1;
  }
  publish(now) {
    this.backlog.push({ id: this.nextId++, at: now });
    if (this.backlog.length > this.keep) this.backlog.shift();
  }
  after(id) {
    return this.backlog.filter((e) => e.id > id);
  }
  get lastId() {
    return this.nextId - 1;
  }
}
