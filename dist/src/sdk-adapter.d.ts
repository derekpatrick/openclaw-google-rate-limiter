import type { RateLimiterConfig, SlidingWindowFifoQueue } from "./rate-limiter.js";
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
export declare function wrapInvocationFn<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, resolveProviderId: (...args: TArgs) => string | undefined, queue: SlidingWindowFifoQueue, config: RateLimiterConfig): (...args: TArgs) => Promise<TResult>;
export declare function bindOpenClawHooks(ctx: AdapterRegistrationContext): void;
export declare function createRateLimiterPluginEntry(queue: SlidingWindowFifoQueue, config: RateLimiterConfig): any;
