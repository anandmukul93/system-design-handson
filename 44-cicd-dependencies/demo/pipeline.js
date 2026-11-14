// The CI pipeline: each step names the files it reads and the step it runs after.
export const STEPS = [
  { name: "install deps", inputs: ["package.json"], seconds: 55 },
  { name: "build api", inputs: ["src/api.js"], after: "install deps", seconds: 40 },
  { name: "build ui", inputs: ["src/ui.js"], after: "install deps", seconds: 65 },
  { name: "test", inputs: ["src/api.js", "src/ui.js"], after: "build ui", seconds: 75 },
  { name: "docs site", inputs: ["docs/README.md"], seconds: 25 },
  { name: "image", inputs: ["src/api.js", "src/ui.js", "package.json"], after: "test", seconds: 35 },
];

export function sampleRepo() {
  return {
    "package.json": '{"deps": {"web-kit": "^2.0.0"}}',
    "src/api.js": "export const api = 1;",
    "src/ui.js": "export const ui = 1;",
    "docs/README.md": "# Docs",
  };
}
