export interface RateLimiterConfig {
    minIntervalMs: number;
    throttledNamespaces: Set<string>;
    bypassNamespaces: Set<string>;
}
export declare function classifyNamespace(providerId: string | undefined, cfg: RateLimiterConfig): "bypass" | "throttle";
export declare class SlidingWindowFifoQueue {
    private readonly minIntervalMs;
    private tail;
    private lastDispatchTime;
    constructor(minIntervalMs: number);
    run<T>(providerId: string | undefined, cfg: RateLimiterConfig, fn: () => Promise<T>): Promise<T>;
}
export declare function createDefaultRateLimiterConfig(): RateLimiterConfig;
