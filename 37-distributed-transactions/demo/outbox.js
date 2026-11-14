// Transactional outbox: the order row and an "event to publish" row are written in ONE local transaction.
// A relay later publishes unsent rows to the broker. It can crash between publishing and marking a row sent,
// so events are never lost but may be published twice: consumers must dedupe.
export class OrderService {
  constructor() {
    this.orders = [];
    this.outbox = []; // { orderId, sent }
    this.nextId = 1;
  }
  placeOrder() {
    const orderId = this.nextId++;
    // these two writes are a single database transaction
    this.orders.push(orderId);
    this.outbox.push({ orderId, sent: false });
    return orderId;
  }
  unsent() {
    return this.outbox.filter((row) => !row.sent);
  }
}

// publishes unsent rows to broker (an array). returns { crashedAfter: orderId | null }
export function runRelay(service, broker, crashPercent, random) {
  for (const row of service.unsent()) {
    broker.push(row.orderId); // 1. publish
    if (random() * 100 < crashPercent) return { crashedAfter: row.orderId }; // crash before step 2
    row.sent = true; // 2. mark sent
  }
  return { crashedAfter: null };
}
