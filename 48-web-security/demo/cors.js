// CORS: the browser asks the server whether a page from another origin may read the response.
// returns { allowed, note }
export function corsDecision(allowedOrigins, allowCredentials, requestOrigin) {
  if (allowedOrigins.includes(requestOrigin)) return { allowed: true, note: "" };
  if (allowedOrigins.includes("*")) {
    if (!allowCredentials) return { allowed: true, note: " (wildcard, without cookies)" };
    return { allowed: false, note: " (browsers refuse '*' together with credentials)" };
  }
  return { allowed: false, note: "" };
}
