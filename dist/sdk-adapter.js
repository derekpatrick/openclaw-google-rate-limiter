// sdk-adapter.js
import { createDefaultRateLimiterConfig, SlidingWindowFifoQueue } from "./rate-limiter.js";

const config = createDefaultRateLimiterConfig();

const queue = new SlidingWindowFifoQueue(config.minIntervalMs);

function logInfo(api, msg) {
  if (api.logger?.info) {
    api.logger.info(msg);
  } else {
    console.log(msg);
  }
}

export function wrapInvocationFn(fn, resolveProviderId, queueObj, cfgObj) {
  return (...args) =>
    (queueObj ?? queue).run(resolveProviderId(...args), cfgObj ?? config, () => fn(...args));
}

export function bindOpenClawHooks(ctx) {
  const { api, queue: q, config: c } = ctx;
  const activeConfig = c ?? config;

  if (typeof api.on === "function") {
    api.on("before_model_resolve", (event) => {
      const payload = (event ?? {});
      const providerId = payload.providerId ?? payload.provider;
      if (!providerId) return;
      logInfo(
        api,
        `[google-rate-limiter] observed provider="${providerId}" minIntervalMs=${activeConfig.minIntervalMs}`,
      );
    });
  }

  logInfo(
    api,
    `[google-rate-limiter] SDK adapter bound (minIntervalMs=${activeConfig.minIntervalMs}, throttled=[${Array.from(activeConfig.throttledNamespaces).join(",")}], bypass=[${Array.from(activeConfig.bypassNamespaces).join(",")}])`,
  );
}

export function createRateLimiterPluginEntry(queueObj, cfgObj) {
  return {
    id: "google-rate-limiter",
    name: "Google Rate Limiter",
    description: "Enforces a 4.2s sliding window on Google free-tier namespaces while bypassing paid/clean namespaces.",
    register(api) {
      // Support runtime config loading if provided by api
      let activeConfig = cfgObj ?? config;
      if (api.pluginConfig && typeof api.pluginConfig === "object") {
        if (typeof api.pluginConfig.minIntervalMs === "number") {
          activeConfig.minIntervalMs = api.pluginConfig.minIntervalMs;
        }
        if (Array.isArray(api.pluginConfig.throttledNamespaces)) {
          activeConfig.throttledNamespaces = new Set(api.pluginConfig.throttledNamespaces);
        }
        if (Array.isArray(api.pluginConfig.bypassNamespaces)) {
          activeConfig.bypassNamespaces = new Set(api.pluginConfig.bypassNamespaces);
        }
      }
      
      bindOpenClawHooks({
        api,
        queue: queueObj ?? queue,
        config: activeConfig,
      });
    },
  };
}

export { config, queue };
export default createRateLimiterPluginEntry(queue, config);
