// Variant 3, long polling: the client asks, the server holds the request until an event exists, then answers.
// Every event costs a full request with headers and a full round trip, but it works through any proxy.
import { HEADER_BYTES } from "./client.js";

export const longPolling = {
  name: "Long polling",
  frameBytes: HEADER_BYTES,
  deliveryDelay: (rtt) => rtt, // response, then the next request has to travel back
  reconnectDelay: (rtt) => rtt, // just send the next poll
  oneEventPerRequest: true,
  resumesFromLastId: true, // the client passes "since id" on every poll
};
