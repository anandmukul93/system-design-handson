// Variant 2, Server-Sent Events: one long HTTP response, server to client only.
// The browser reconnects by itself and sends Last-Event-ID, so the server can replay what was missed.
export const serverSentEvents = {
  name: "SSE",
  frameBytes: 10,
  deliveryDelay: (rtt) => rtt / 2,
  reconnectDelay: () => 3000, // the default `retry:` interval
  oneEventPerRequest: false,
  resumesFromLastId: true,
};
