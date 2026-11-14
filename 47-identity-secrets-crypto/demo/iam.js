// IAM policy evaluation: collect the statements that match the request, then
//   any matching Deny -> DENY      otherwise any matching Allow -> ALLOW      otherwise DENY (implicit)
export function globMatches(pattern, text) {
  const escaped = pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp("^" + escaped.join(".*") + "$").test(text);
}

// returns { allowed, reason, matching }
export function evaluate(statements, action, resource) {
  const matching = statements.filter(
    (s) => globMatches(s.action, action) && globMatches(s.resource, resource),
  );
  if (matching.some((s) => s.effect === "Deny"))
    return { allowed: false, reason: "explicit deny wins", matching };
  if (matching.some((s) => s.effect === "Allow")) return { allowed: true, reason: "allowed", matching };
  return { allowed: false, reason: "implicit: nothing allowed it", matching };
}
