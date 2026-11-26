// rate-limiter.js
const DEFAULT_THROTTLED = new Set(["google-test", "telegram", "background"]);
const DEFAULT_BYPASS = new Set(["gemini-clean"]);

export function classifyNamespace(providerId, cfg) {
  const ns = (providerId ?? "").trim().toLowerCase();
  if (!ns) return "throttle"; // Default-safe: throttle unknown or unspecified free tiers

  if (cfg.bypassNamespaces.has(ns) || ns.endsWith("-clean") || ns.includes("paid")) {
    return "bypass";
  }
  if (cfg.throttledNamespaces.has(ns) || ns === "google-test" || ns === "telegram" || ns === "background") {
    return "throttle";
  }
  return "throttle";
}

export class SlidingWindowFifoQueue {
  #tail = Promise.resolve();
  #lastDispatchTime = 0;

  constructor(minIntervalMs) {
    this.minIntervalMs = minIntervalMs;
  }

  async run(providerId, cfg, fn) {
    if (classifyNamespace(providerId, cfg) === "bypass") {
      return fn();
    }

    const scheduled = this.#tail.then(async () => {
      const now = Date.now();
      const elapsed = now - this.#lastDispatchTime;
      const waitMs = Math.max(0, this.minIntervalMs - elapsed);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      this.#lastDispatchTime = Date.now();
      return fn();
    });

    this.#tail = scheduled.then(
      () => undefined,
      () => undefined,
    );

    return scheduled;
  }
}

export function createDefaultRateLimiterConfig() {
  return {
    minIntervalMs: 4200,
    throttledNamespaces: new Set(DEFAULT_THROTTLED),
    bypassNamespaces: new Set(DEFAULT_BYPASS),
  };
}
