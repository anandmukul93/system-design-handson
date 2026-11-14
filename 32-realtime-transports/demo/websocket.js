// Variant 1, WebSocket: one upgraded connection, tiny frames, both directions.
// Nothing in the protocol resumes after a drop: the app must reconnect and re-sync by itself.
export const webSocket = {
  name: "WebSocket",
  frameBytes: 6,
  deliveryDelay: (rtt) => rtt / 2, // server pushes: one way trip
  reconnectDelay: () => 3000,
  oneEventPerRequest: false,
  resumesFromLastId: false,
};
