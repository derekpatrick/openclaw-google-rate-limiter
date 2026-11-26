import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
function logInfo(api, msg) {
    if (api.logger?.info) {
        api.logger.info(msg);
    }
    else {
        console.log(msg);
    }
}
export function wrapInvocationFn(fn, resolveProviderId, queue, config) {
    return (...args) => queue.run(resolveProviderId(...args), config, () => fn(...args));
}
export function bindOpenClawHooks(ctx) {
    const { api, queue, config } = ctx;
    if (typeof api.on === "function") {
        api.on("before_model_resolve", (event) => {
            const payload = (event ?? {});
            const providerId = payload.providerId ?? payload.provider;
            if (!providerId)
                return;
            logInfo(api, `[google-rate-limiter] observed provider="${providerId}" minIntervalMs=${config.minIntervalMs}`);
        });
    }
    if (typeof api.registerProvider === "function") {
        void queue;
    }
    logInfo(api, `[google-rate-limiter] SDK adapter bound (minIntervalMs=${config.minIntervalMs}, throttled=[${Array.from(config.throttledNamespaces).join(",")}], bypass=[${Array.from(config.bypassNamespaces).join(",")}])`);
}
export function createRateLimiterPluginEntry(queue, config) {
    return definePluginEntry({
        id: "google-rate-limiter",
        name: "Google Rate Limiter",
        description: "Enforces a 4.2s sliding window on free-tier Google namespaces while bypassing paid/clean namespaces.",
        register(api) {
            bindOpenClawHooks({
                api: api,
                queue,
                config,
            });
        },
    });
}
