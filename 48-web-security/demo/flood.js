// A request flood passing through two filters in front of the app.
const SIGNATURE_MATCH_RATE = 0.4; // share of attack traffic a WAF recognises
const PER_IP_LIMIT = 20; // requests per second

// returns { reachingApp, blocked } in requests per second
export function filterTraffic({ legitimate, attack, attackerIps, waf, rateLimit }) {
  let blocked = 0;
  if (waf) {
    const caught = attack * SIGNATURE_MATCH_RATE;
    attack -= caught;
    blocked += caught;
  }
  if (rateLimit) {
    const allowed = Math.min(attack, attackerIps * PER_IP_LIMIT); // each bot IP gets its small share
    blocked += attack - allowed;
    attack = allowed;
  }
  return { reachingApp: legitimate + attack, blocked };
}
