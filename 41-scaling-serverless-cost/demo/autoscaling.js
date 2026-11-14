// Capacity model 2: target-tracking autoscaling. Same contract as fixed_servers.js.
// Keep average CPU near a target by adding or removing servers. New servers take minutes to boot, and a
// cool-down stops the scaler from flapping, so a sudden spike still hurts until capacity catches up.
import { serveMinute, RPS_PER_SERVER } from "./servers.js";

export function autoscaling({
  targetCpuPercent,
  cooldownMinutes,
  bootMinutes,
  startServers = 5,
  minServers = 2,
}) {
  let servers = startServers;
  let booting = []; // { count, readyAt }
  let lastScaledAt = -Infinity;
  return {
    minute(m, demand) {
      for (const b of booting) if (b.readyAt <= m) servers += b.count;
      booting = booting.filter((b) => b.readyAt > m);
      const result = serveMinute(servers, demand);

      if (m - lastScaledAt >= cooldownMinutes) {
        const wanted = Math.ceil(demand / ((RPS_PER_SERVER * targetCpuPercent) / 100));
        const onTheWay = booting.reduce((sum, b) => sum + b.count, 0);
        if (wanted > servers + onTheWay) {
          booting.push({ count: wanted - servers - onTheWay, readyAt: m + bootMinutes });
          lastScaledAt = m;
        } else if (wanted < servers * 0.8) {
          servers = Math.max(minServers, wanted); // scaling in is instant
          lastScaledAt = m;
        }
      }
      return result;
    },
  };
}
