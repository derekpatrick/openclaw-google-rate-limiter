import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import type { RateLimiterConfig, SlidingWindowFifoQueue } from "./rate-limiter.ts";

export interface PluginApiLike {
  logger?: {
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
    error?: (msg: string) => void;
  };
  on?: (hookName: string, handler: (...args: unknown[]) => unknown) => void;
  registerProvider?: (providerSpec: Record<string, unknown>) => void;
}

export interface AdapterRegistrationContext {
  api: PluginApiLike;
  queue: SlidingWindowFifoQueue;
  config: RateLimiterConfig;
}

function logInfo(api: PluginApiLike, msg: string): void {
  if (api.logger?.info) {
    api.logger.info(msg);
  } else {
    console.log(msg);
  }
}

export function wrapInvocationFn<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  resolveProviderId: (...args: TArgs) => string | undefined,
  queue: SlidingWindowFifoQueue,
  config: RateLimiterConfig,
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) =>
    queue.run(resolveProviderId(...args), config, () => fn(...args));
}

export function bindOpenClawHooks(ctx: AdapterRegistrationContext): void {
  const { api, queue, config } = ctx;

  if (typeof api.on === "function") {
    api.on("before_model_resolve", (event: unknown) => {
      const payload = (event ?? {}) as { provider?: string; providerId?: string };
      const providerId = payload.providerId ?? payload.provider;
      if (!providerId) return;
      logInfo(
        api,
        `[google-rate-limiter] observed provider="${providerId}" minIntervalMs=${config.minIntervalMs}`,
      );
    });
  }

  logInfo(
    api,
    `[google-rate-limiter] SDK adapter bound (minIntervalMs=${config.minIntervalMs}, throttled=[${Array.from(config.throttledNamespaces).join(",")}], bypass=[${Array.from(config.bypassNamespaces).join(",")}])`,
  );
}

export function createRateLimiterPluginEntry(
  queue: SlidingWindowFifoQueue,
  config: RateLimiterConfig,
) {
  return definePluginEntry({
    id: "google-rate-limiter",
    name: "Google Rate Limiter",
    description:
      "Enforces a 4.2s sliding window on free-tier Google namespaces while bypassing paid/clean namespaces (gemini-clean).",
    register(api: unknown) {
      bindOpenClawHooks({
        api: api as PluginApiLike,
        queue,
        config,
      });
    },
  });
}
