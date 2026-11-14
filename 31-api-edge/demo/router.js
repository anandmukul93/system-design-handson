// Gateway routing: pick an upstream service from the path prefix and the API-Version header.
export const DEFAULT_VERSION = "2025-01-01";

export const ROUTES = [
  { prefix: "/orders", pick: (version) => (version >= "2026-01-01" ? "orders-v2" : "orders-v1") },
  { prefix: "/users", pick: () => "users-v1" },
];

// returns { status: 200, upstream, version, defaulted } or { status: 404 }
export function route(path, versionHeader, routes = ROUTES) {
  const match = routes.find((r) => path.startsWith(r.prefix));
  if (!match) return { status: 404 };
  const version = versionHeader || DEFAULT_VERSION;
  return { status: 200, upstream: match.pick(version), version, defaulted: !versionHeader };
}
