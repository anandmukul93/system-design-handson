// Capacity model 1: a fixed number of servers. All three models share one contract:
//   model.minute(minuteOfDay, demandRps) -> { capacity, latencyMs, cost, overloaded, utilisation, coldStarts }
// Simple and predictable. You pay for the peak all day, or you fall over at the peak.
import { serveMinute } from "./servers.js";

export function fixedServers({ servers }) {
  return { minute: (m, demand) => serveMinute(servers, demand) };
}
