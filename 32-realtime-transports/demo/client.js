// One client per transport. All three follow the same contract, so the UI can treat them alike:
//   tick(stream, now, rtt, stepMs) -> [log messages]     disconnect(rtt)     averageDelay()
export const HEADER_BYTES = 450; // one HTTP request or response worth of headers
const PAYLOAD_BYTES = 40;

export class TransportClient {
  constructor(transport) {
    this.transport = transport;
    this.requests = 1;
    this.bytes = HEADER_BYTES; // the initial handshake
    this.delays = [];
    this.missed = 0;
    this.downFor = 0; // ms until reconnected
    this.lastId = 0;
  }
  get state() {
    return this.downFor > 0 ? "reconnecting" : "open";
  }
  disconnect(rtt) {
    this.downFor = this.transport.reconnectDelay(rtt);
  }
  tick(stream, now, rtt, stepMs) {
    if (this.downFor > 0) {
      this.downFor -= stepMs;
      return this.downFor <= 0 ? [this.reconnect(stream)] : [];
    }
    for (const event of stream.after(this.lastId)) {
      this.delays.push(this.transport.deliveryDelay(rtt) + (now - event.at));
      this.bytes += this.transport.frameBytes + PAYLOAD_BYTES;
      this.lastId = event.id;
      if (this.transport.oneEventPerRequest) {
        this.requests++; // the poll returned; the client must ask again
        break;
      }
    }
    return [];
  }
  reconnect(stream) {
    this.requests++;
    this.bytes += HEADER_BYTES;
    const name = this.transport.name;
    if (this.transport.resumesFromLastId)
      return { text: `${name} reconnected and resumed from id ${this.lastId}`, kind: "ok" };
    const lost = stream.after(this.lastId).length;
    this.missed += lost;
    this.lastId = stream.lastId;
    return {
      text: `${name} reconnected by app code: ${lost} events lost unless the app re-syncs`,
      kind: lost ? "warn" : "ok",
    };
  }
  averageDelay(last = 50) {
    const recent = this.delays.slice(-last);
    return recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  }
}
