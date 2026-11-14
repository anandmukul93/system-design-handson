// Topological sort: every resource comes after the resources it depends on.
// Create in this order; delete in the reverse order (dependents first).
import { dependenciesOf } from "./resources.js";

export function creationOrder(resources) {
  const order = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name) || !resources[name]) return;
    seen.add(name);
    dependenciesOf(resources[name]).forEach(visit);
    order.push(name);
  };
  Object.keys(resources).forEach(visit);
  return order;
}

export function deletionOrder(resources) {
  return creationOrder(resources).reverse();
}
