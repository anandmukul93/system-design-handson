// Strategy 2, blue-green. Same contract as rolling.js.
// Bring up a complete second fleet (green) next to the live one (blue), then flip the router in one move.
// Rollback is flipping back, instantly. The cost is double capacity during the deploy.
export const blueGreen = {
  name: "blue-green",
  advance(state) {
    if (!state.green) {
      state.green = state.instances.map(() => "v2");
      return "green fleet (v2) up and warmed; switching the router next";
    }
    state.v2TrafficPercent = 100;
    return "router switched: all traffic on green";
  },
  isComplete: (state) => state.v2TrafficPercent === 100,
};
