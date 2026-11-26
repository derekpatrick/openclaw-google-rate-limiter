import {
  createDefaultRateLimiterConfig,
  SlidingWindowFifoQueue,
} from "./src/rate-limiter.js";
import { createRateLimiterPluginEntry } from "./src/sdk-adapter.js";

const config = createDefaultRateLimiterConfig();
config.bypassNamespaces.add("gemini-clean");

const queue = new SlidingWindowFifoQueue(config.minIntervalMs);

export { config, queue, wrapInvocationFn } from "./src/sdk-adapter.js";
export default createRateLimiterPluginEntry(queue, config);
