// Event sourcing core: state is never stored directly. It is a fold (reduce) of `apply` over the event log.
export function emptyState(accounts) {
  return Object.fromEntries(accounts.map((a) => [a, 0]));
}

// pure and deterministic: the same events always produce the same state
export function apply(state, event) {
  if (event.type === "Deposited" || event.type === "Credited") state[event.account] += event.amount;
  if (event.type === "Debited") state[event.account] -= event.amount;
  return state;
}

// rebuild state from scratch, or from a snapshot { seq, state } plus only the events after it
export function replay(events, accounts, snapshot = null) {
  const base = snapshot ? { ...snapshot.state } : emptyState(accounts);
  const tail = events.slice(snapshot ? snapshot.seq : 0);
  return { state: tail.reduce(apply, base), applied: tail.length };
}

export function describe(event) {
  const extra = [event.tx, event.compensation && "compensation"].filter(Boolean).join(", ");
  return `#${event.seq} ${event.type}(${event.account}, ${event.amount}${extra ? ", " + extra : ""})`;
}
