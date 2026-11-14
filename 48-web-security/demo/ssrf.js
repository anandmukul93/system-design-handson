// SSRF: the server fetches a URL chosen by the user, so the user can aim it at internal addresses,
// such as the cloud metadata endpoint that hands out credentials.
const PRIVATE_HOST =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|localhost$|\[?::1\]?$)/;

export function isPrivateHost(hostname) {
  return PRIVATE_HOST.test(hostname);
}
// returns { allowed, reason }
export function validateDestination(urlText) {
  let url;
  try {
    url = new URL(urlText);
  } catch {
    return { allowed: false, reason: "not a URL" };
  }
  if (!["http:", "https:"].includes(url.protocol))
    return { allowed: false, reason: `blocked scheme ${url.protocol}` };
  if (isPrivateHost(url.hostname))
    return { allowed: false, reason: `blocked: ${url.hostname} is a private / link-local address` };
  return {
    allowed: true,
    reason: `allowed ${url.href} (also re-check the resolved IP to stop DNS rebinding)`,
  };
}
