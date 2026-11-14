// Upcasting: stored events are never rewritten. Old versions are converted to the newest shape when read,
// one version step at a time, so every reader only has to understand the latest schema.
const UPCASTERS = {
  1: {
    note: "v1→v2: split name",
    convert(event) {
      const [first, ...rest] = event.name.split(" ");
      return { schema_version: 2, first, last: rest.join(" "), name: event.name };
    },
  },
  2: {
    note: "v2→v3: drop name",
    convert({ name, ...rest }) {
      return { ...rest, schema_version: 3 };
    },
  },
};

// returns { event (latest version), notes: [what was converted] }
export function upcast(event) {
  const notes = [];
  while (UPCASTERS[event.schema_version]) {
    const step = UPCASTERS[event.schema_version];
    event = step.convert(event);
    notes.push(step.note);
  }
  return { event, notes };
}
