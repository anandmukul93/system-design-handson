// Helm-style templating: fill {{ .name }} placeholders in a manifest from a values file.
// "replicas: 3\nimage: shop/web" -> { replicas: "3", image: "shop/web" }
export function parseValues(text) {
  const values = {};
  for (const line of text.split("\n")) {
    const colon = line.indexOf(":");
    if (colon > 0) values[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return values;
}

export function render(template, values) {
  return template.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_, name) =>
    name in values ? values[name] : `<missing value: ${name}>`,
  );
}
