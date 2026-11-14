// Simulated user traffic: what error rate do we observe with this share of requests on v2?
const HEALTHY_ERROR_RATE = 0.005;
const BUGGY_ERROR_RATE = 0.2;

export function observeErrorPercent(v2TrafficPercent, v2IsBuggy, random, requests = 200) {
  let errors = 0;
  for (let i = 0; i < requests; i++) {
    const onV2 = random() * 100 < v2TrafficPercent;
    if (random() < (onV2 && v2IsBuggy ? BUGGY_ERROR_RATE : HEALTHY_ERROR_RATE)) errors++;
  }
  return (100 * errors) / requests;
}
