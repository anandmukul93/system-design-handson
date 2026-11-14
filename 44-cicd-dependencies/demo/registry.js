// A pretend package registry: package -> version -> its own dependencies.
export const REGISTRY = {
  "web-kit": {
    "2.0.0": { "http-lib": "^1.0.0" },
    "2.3.0": { "http-lib": "^1.4.0" },
    "3.0.0": { "http-lib": "^2.0.0" },
  },
  "http-lib": { "1.0.0": {}, "1.4.2": {}, "1.9.0": {}, "2.0.0": {}, "2.1.0": {} },
  "auth-sdk": { "1.0.0": { "http-lib": "~1.4.0" }, "2.0.0": { "http-lib": "^2.1.0" } },
};
