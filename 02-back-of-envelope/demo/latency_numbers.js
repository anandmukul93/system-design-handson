// "Latency numbers every programmer should know", in nanoseconds.
export const LATENCY_NS = [
  ["L1 cache", 0.5],
  ["Branch mispredict", 5],
  ["Main memory", 100],
  ["Compress 1 KB", 10e3],
  ["Send 2 KB over 1 Gbps", 20e3],
  ["SSD random read", 150e3],
  ["Read 1 MB from memory", 250e3],
  ["Datacenter round trip", 500e3],
  ["Read 1 MB from SSD", 1e6],
  ["Disk seek", 10e6],
  ["Read 1 MB from disk", 20e6],
  ["CA → Netherlands → CA", 150e6],
];
