# OpenClaw Google AI Studio Free-Tier Rate Limiter Plugin v1.1.0

A lightweight, robust rate-limiting plugin designed for OpenClaw to safely navigate Google AI Studio's Gemini free-tier sliding window rate limits (RPM and TPM). Specifically engineered for OpenClaw 2026.11.10 with a modular SDK adapter architecture.

## Features
- **Configurable Sliding Window Pacing:** Defaults to an optimal `4200ms` interval between requests to maximize free-tier throughput without hitting 429 rate limits.
- **Configurable Namespace Policies:** Fully configurable via `openclaw.plugin.json` and `openclaw.json` plugin config. Easily designate throttled namespaces (e.g. `google-test`, `telegram`, `background`) and paid/clean bypass namespaces (e.g. `gemini-clean`).
- **Thin SDK Adapter Layer:** Isolates OpenClaw SDK hooks and execution wrappers for future-proof compatibility.

## Configuration Example (`openclaw.json`)
```json
"google-rate-limiter": {
  "enabled": true,
  "config": {
    "minIntervalMs": 4200,
    "throttledNamespaces": ["google-test", "telegram", "background"],
    "bypassNamespaces": ["gemini-clean"]
  }
}
```

## Changelog
### v1.1.0
- Added user-configurable `configSchema` support (`minIntervalMs`, `throttledNamespaces`, `bypassNamespaces`).
- Hardened FIFO queue support for `google-test`, `telegram`, and `background`.
- Added clean paid/clean bypass support for `gemini-clean`.
- Updated for OpenClaw 2026.11.10 plugin SDK specifications.

### v1.0.0
- Initial release of Google AI Studio Free-Tier Rate Limiter.
