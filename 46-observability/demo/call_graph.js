// The system under observation: who calls whom, how long each service takes by itself, and injected faults.
export const CALLS = {
  gateway: ["orders"],
  orders: ["inventory", "payments"],
  inventory: [],
  payments: ["bank"],
  bank: [],
};
export const OWN_LATENCY_MS = { gateway: 5, orders: 15, inventory: 20, payments: 30, bank: 60 };
export const SERVICES = Object.keys(CALLS);

// service -> { extraLatencyMs, errorPercent }
export function noFaults() {
  return Object.fromEntries(SERVICES.map((s) => [s, { extraLatencyMs: 0, errorPercent: 0 }]));
}
