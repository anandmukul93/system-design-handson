// The resource model: what exists at the start, what each resource depends on, and which field changes
// cannot be done in place (the provider has to destroy the resource and create a new one).
export function initialState() {
  return {
    vpc: { type: "vpc", cidr: "10.0.0.0/16" },
    subnet_a: { type: "subnet", vpc: "vpc", cidr: "10.0.1.0/24" },
    db: { type: "database", subnet: "subnet_a", size: "small", engine: "postgres15" },
    web: { type: "instance", subnet: "subnet_a", size: "t3.small", count: 2 },
  };
}

export const FORCES_REPLACEMENT = {
  database: ["engine"],
  subnet: ["cidr", "vpc"],
  vpc: ["cidr"],
  instance: ["subnet"],
};

// a resource depends on whatever its "vpc" and "subnet" fields name
export function dependenciesOf(resource) {
  return [resource.vpc, resource.subnet].filter(Boolean);
}
