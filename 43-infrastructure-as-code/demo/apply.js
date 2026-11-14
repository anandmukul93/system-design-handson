// Apply: carry out a plan against the state, one action at a time, in the order the plan gives.
export function apply(state, actions) {
  for (const { action, name, resource } of actions) {
    if (action === "delete") delete state[name];
    else state[name] = JSON.parse(JSON.stringify(resource));
  }
  return state;
}
