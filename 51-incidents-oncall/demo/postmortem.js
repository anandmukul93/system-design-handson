// Drafts a blameless postmortem from the incident record: what happened and when, not who to blame.
export function draftPostmortem(incident) {
  const { mttd, mtta, mttr } = incident.metrics;
  const timeline = incident.timeline.map((e) => `- +${e.minute}: ${e.text}`).join("\n");
  const wentPoorly = incident.actionsTaken.includes("failover")
    ? "We spent time on a DB failover the data did not support"
    : "Nothing major: we followed the evidence";
  return `# Postmortem: checkout errors after deploy 7f3a (blameless)

## Impact
${incident.usersAffected.toLocaleString()} users saw checkout failures for ${mttr} minutes.

## Timeline (minutes after impact)
${timeline}

## Metrics
MTTD ${mttd} min · MTTA ${mtta ?? "n/a"} min · MTTR ${mttr} min

## Root cause
A new code path in PriceFormatter dereferenced a missing currency field.

## What went well
- Rollback was available and fast

## What went poorly
- ${wentPoorly}

## Action items
- [ ] Canary deploys with automatic rollback on error rate (owner: checkout, due: +2 weeks)
- [ ] Contract test for missing currency field (owner: checkout)
- [ ] Alert on 5-minute burn rate so detection is faster than ${mttd} min (owner: SRE)`;
}
