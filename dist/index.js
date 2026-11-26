// index.js
import { config, queue, wrapInvocationFn, createRateLimiterPluginEntry } from "./sdk-adapter.js";

export { config, queue, wrapInvocationFn };
export default createRateLimiterPluginEntry(queue, config);
