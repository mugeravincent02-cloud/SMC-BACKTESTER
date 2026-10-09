# Intermittent market-data failures — 2026-10-09

## Findings

The reported 500s and later successful direct requests establish intermittent failure, not its cause. The supplied Render messages discarded the underlying Axios error, upstream status and timing. This local investigation does not claim access to Render logs or reproduction of the production failure. Improved deployed logs are needed before choosing a transport, timeout, rate-limit or other remediation.

Both `/api/candles` and `/api/smc/swings` validate inputs and independently call `BinanceService.fetchCandles`, which requests `https://api.binance.com/api/v3/klines`. Each then runs `DataCleaner`; the SMC route additionally runs detection and overlay normalization. One dashboard load requests both endpoints in parallel and requires both to succeed, so one failed endpoint makes the combined load fail even if the other returned data. No cache, deduplication or retry layer exists.

Upstream timeout is 8000 ms; client timeout is 10000 ms. These remain unchanged, and each endpoint still makes one upstream attempt. Tests cover the timeout option and simulated timeout/network codes; no real Render timeout was induced.

Frontend inspection found the only automatic load in Home's initial effect, with a stable `useCallback([])` dependency; the other trigger is the explicit Load Market button. Pending control edits, drawing/cursor/Fibonacci changes, overlay toggles and verification selection do not call the loader or change the initial effect dependency. App renders Home without a changing key. No polling, retry interceptor or drawing-driven reload was found. Development StrictMode can run the initial setup/cleanup/setup sequence; cleanup aborts the earlier frontend requests. An already-forwarded server request does not currently propagate client cancellation to Binance. This is a possible source of extra development requests, not evidence for the reported Render failures.

The existing AbortController is passed to both Axios requests. Starting a new load aborts the previous controller; checks of its aborted signal prevent obsolete success/error/finally paths from overwriting current state. These runtime paths were preserved. A new adapter-based client test checks the actual service/API wrappers issue one call per endpoint and share cancellation; it is not a browser test of Home's effect lifecycle.

## Scoped changes

- `server/market/MarketDiagnostics.js`: server-generated request IDs and one-line JSON failure records containing endpoint, upstream hostname/path, validated and bounded symbol/interval/limit, elapsed milliseconds, transport code, HTTP status, numeric provider code and a sanitized message of at most 240 characters.
- `server/market/BinanceService.js`: replaces opaque failure logging with diagnostics, passes internal correlation context, identifies non-array responses as `INVALID_UPSTREAM_RESPONSE`, and records their available HTTP status. The fixed URL, 8-second timeout, one attempt and generic thrown message remain unchanged.
- `server/controllers/MarketController.js` and `SMCController.js`: pass the same request ID into the service and log correlated endpoint failures with `upstream`, `cleaning` or `smc` stage. SMC's catch previously exposed arbitrary dependency error messages; it now returns the same generic 500 message as the candles route. A regression injects a private cleaner exception through both routes and verifies it is not returned.
- `tests/market/diagnostics.test.js`: sanitation/bounds, approved fields, hostile/null errors, transport/timeout codes, invalid envelopes and one-attempt behavior.
- `tests/api/market-diagnostics.test.js`: actual local Express endpoints with stubbed Axios; correlated failures for upstream 400/418/429/451/500/503, recovery, unchanged public errors and cleaner-error privacy.
- `tests/api/market.test.js`: existing assertions now also verify the internal request context without changing query expectations.
- `client/tests/dashboard.test.js`: shared cancellation and no-retry regression using the actual clients with a deterministic Axios adapter.
- `docs/API.md` and `docs/Baseline.md`: append the diagnostic contract and investigation status.

No frontend runtime, Fibonacci/drawing code, SMC strategy, mitigation or BOS/CHoCH endpoint code was changed in this investigation. All prior work remains uncommitted in the drawing-tools worktree.

## Diagnostic privacy and interpretation

No incoming request IDs are trusted or forwarded. IDs are server-generated and internal only; API response bodies/headers do not expose these records. Diagnostic extraction reads only scalar `code`, `response.status`, `response.data.code`, `response.data.msg` (or a bounded text body), and the error message. It never reads/logs request config, request headers, full Axios errors or stack properties. Messages containing credential/header metadata are wholly redacted; URLs, token-like strings, HTML tags and control characters are removed/redacted before bounding the message. Other body fields are not serialized.

An upstream failure produces `binance_failure` plus `market_request_failure:upstream` with the same requestId. The detailed status/code lives on the first record; the second is the endpoint outcome after the service replaces the error with its public-safe message. Cleaner/SMC failures are logged at their own stage without fabricating an upstream status. Null status/code means unavailable, not an assumed cause. Successful calls do not create these failure records.

## Verification

- `npm.cmd test`: **78 passed**, zero failures (71 existing plus 7 diagnostic tests).
- `npm.cmd --prefix client test`: **34 passed**, zero failures, including all drawing/Fibonacci/structure regressions and one new cancellation test.
- `npm.cmd --prefix client run lint`: passed, no warnings.
- `npm.cmd --prefix client run build`: passed.
- `git diff --check`: passed, with Git line-ending notices.

Backend tests use real loopback Express endpoints with stubbed upstream Axios. No live Binance/Render production requests or browser network-panel checks were performed. The production cause remains unresolved until a failure is captured with the deployed diagnostics.

## Manual Render follow-up

1. Review the pending diff and perform your own approved commit/push/merge workflow. Then deploy that approved backend revision through the normal Render workflow. No new environment variables, timeout changes or provider changes are required. No deployment was performed here.
2. Reproduce a load from the frontend and, when needed, request `/api/candles` and `/api/smc/swings` with the same symbol/interval/limit. Record the failure's time, endpoint and browser HTTP status. In the browser Network panel, drawing/cursor/Fibonacci/SMC UI changes should add no market requests; Load Market should add two, while the first development mount may include canceled StrictMode requests.
3. Capture the paired JSON log records by requestId. Compare `errorCode`, `upstreamStatus`, `upstreamCode`, sanitized `message` and `elapsedMs`. For downstream failures inspect the stage. Share sanitized records and timing before choosing a retry, timeout, network or provider-specific fix.

Nothing was staged, committed, pushed, merged or deployed; production is unchanged.
