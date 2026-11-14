// Content-addressed build cache: a step's cache key is a hash of everything that can change its output
// (its input files and the key of the step before it). Same key = same output, so the step can be skipped.
const CACHE_HIT_SECONDS = 1; // time to download a cached result

export function cacheKey(step, files, upstreamKey, hashFn) {
  const content = step.inputs.map((path) => path + files[path]).join("|") + (upstreamKey || "");
  return (hashFn(content) >>> 0).toString(16).padStart(8, "0");
}

// run all steps; `cache` is a Set of keys that survives between runs
// returns { steps: [{ name, key, hit, seconds }], totalSeconds, uncachedSeconds }
export function runPipeline(steps, files, cache, hashFn) {
  const keys = {};
  const results = steps.map((step) => {
    const key = (keys[step.name] = cacheKey(step, files, keys[step.after], hashFn));
    const hit = cache.has(step.name + key);
    cache.add(step.name + key);
    return { name: step.name, key, hit, seconds: hit ? CACHE_HIT_SECONDS : step.seconds };
  });
  return {
    steps: results,
    totalSeconds: results.reduce((sum, r) => sum + r.seconds, 0),
    uncachedSeconds: steps.reduce((sum, s) => sum + s.seconds, 0),
  };
}
