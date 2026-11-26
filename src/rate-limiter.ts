export interface RateLimiterConfig {
  minIntervalMs: number;
  throttledNamespaces: Set<string>;
  bypassNamespaces: Set<string>;
}

const DEFAULT_THROTTLED = new Set(["google-test"]);
const DEFAULT_BYPASS = new Set(["gemini-clean"]);

export function classifyNamespace(
  providerId: string | undefined,
  cfg: RateLimiterConfig,
): "bypass" | "throttle" {
  const ns = (providerId ?? "").trim().toLowerCase();
  if (!ns) return "bypass";

  if (cfg.bypassNamespaces.has(ns) || ns.endsWith("-clean") || ns.includes("paid")) {
    return "bypass";
  }
  if (cfg.throttledNamespaces.has(ns)) {
    return "throttle";
  }
  return "bypass";
}

export class SlidingWindowFifoQueue {
  private tail: Promise<void> = Promise.resolve();
  private lastDispatchTime = 0;

  constructor(private readonly minIntervalMs: number) {}

  public async run<T>(
    providerId: string | undefined,
    cfg: RateLimiterConfig,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (classifyNamespace(providerId, cfg) === "bypass") {
      return fn();
    }

    const scheduled = this.tail.then(async () => {
      const now = Date.now();
      const elapsed = now - this.lastDispatchTime;
      const waitMs = Math.max(0, this.minIntervalMs - elapsed);
      if (waitMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
      }
      this.lastDispatchTime = Date.now();
      return fn();
    });

    this.tail = scheduled.then(
      () => undefined,
      () => undefined,
    );

    return scheduled;
  }
}

export function createDefaultRateLimiterConfig(): RateLimiterConfig {
  return {
    minIntervalMs: 4200,
    throttledNamespaces: new Set(DEFAULT_THROTTLED),
    bypassNamespaces: new Set(DEFAULT_BYPASS),
  };
}
