// A limit order book with price-time priority. Deterministic: the same orders in the same sequence always
// produce the same fills and the same book, which is what makes replay and hot standbys possible.
export class MatchingEngine {
  constructor() {
    this.bids = []; // buy orders, best (highest) price first, then oldest first
    this.asks = []; // sell orders, best (lowest) price first, then oldest first
    this.sequence = 0;
  }

  // order: { id, side: "buy" | "sell", price, quantity }. Returns the fills it caused.
  submit(order) {
    const o = { ...order, sequence: ++this.sequence };
    const fills = [];
    const opposite = o.side === "buy" ? this.asks : this.bids;
    const crosses = (resting) => (o.side === "buy" ? resting.price <= o.price : resting.price >= o.price);
    while (o.quantity > 0 && opposite.length && crosses(opposite[0])) {
      const resting = opposite[0];
      const quantity = Math.min(o.quantity, resting.quantity);
      fills.push({
        price: resting.price, // the resting order sets the price
        quantity,
        buyOrder: o.side === "buy" ? o.id : resting.id,
        sellOrder: o.side === "sell" ? o.id : resting.id,
      });
      o.quantity -= quantity;
      resting.quantity -= quantity;
      if (resting.quantity === 0) opposite.shift();
    }
    if (o.quantity > 0) this.rest(o);
    return fills;
  }

  rest(o) {
    const book = o.side === "buy" ? this.bids : this.asks;
    book.push(o);
    const byPrice = o.side === "buy" ? (a, b) => b.price - a.price : (a, b) => a.price - b.price;
    book.sort((a, b) => byPrice(a, b) || a.sequence - b.sequence);
  }

  // total quantity per price level: [[price, quantity]], best first
  depth(side) {
    const levels = new Map();
    for (const o of side === "buy" ? this.bids : this.asks)
      levels.set(o.price, (levels.get(o.price) || 0) + o.quantity);
    return [...levels];
  }
  spread() {
    return this.bids.length && this.asks.length ? this.asks[0].price - this.bids[0].price : null;
  }
  // a comparable summary of the whole book
  fingerprint() {
    const summary = (book) => book.map((o) => [o.id, o.price, o.quantity]);
    return JSON.stringify([summary(this.bids), summary(this.asks)]);
  }
}

// feed a journal of orders to a fresh engine: used for recovery and for verifying determinism
export function replayJournal(journal) {
  const engine = new MatchingEngine();
  let fillCount = 0;
  for (const order of journal) fillCount += engine.submit(order).length;
  return { engine, fillCount };
}
