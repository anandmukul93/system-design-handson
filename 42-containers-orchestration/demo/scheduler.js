// The scheduler: decide which node a new pod runs on. Here: the ready node with the fewest pods.
export function pickNode(cluster) {
  const ready = cluster.nodes.filter((n) => n.ready);
  if (!ready.length) return null;
  const podCount = (node) => cluster.alivePods().filter((p) => p.node === node.name).length;
  return ready.reduce((best, node) => (podCount(node) < podCount(best) ? node : best)).name;
}
