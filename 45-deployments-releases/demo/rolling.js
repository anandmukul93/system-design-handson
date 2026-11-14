// Strategy 1, rolling update. All three strategies share one contract over the same state object:
//   state = { instances: ["v1" | "v2", ...], green: null | [...], v2TrafficPercent }
//   advance(state) -> log text or null       isComplete(state) -> boolean
// Replace instances a couple at a time. No extra capacity needed, but both versions serve side by side
// and a rollback means rolling all the way back.
const BATCH = 2;

export const rolling = {
  name: "rolling (2 at a time)",
  advance(state) {
    for (let replaced = 0; replaced < BATCH; replaced++) {
      const next = state.instances.indexOf("v1");
      if (next >= 0) state.instances[next] = "v2";
    }
    const v2Count = state.instances.filter((v) => v === "v2").length;
    state.v2TrafficPercent = (100 * v2Count) / state.instances.length; // traffic follows the instances
    return null;
  },
  isComplete: (state) => !state.instances.includes("v1"),
};
