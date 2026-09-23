# Repository baseline — 2026-09-18

Scope: the first task in Handoff.txt. Reviewed application source, package manifests, configuration, repository layout and all project documentation. No implementation changes made. Stage 01 has not started; its scope below is a proposal.

## Implemented

- Express exposes `/`, `/api/candles`, and `/api/smc/swings`.
- Binance service fetches candles; DataCleaner converts OHLCV values to numbers and checks that the outer input is an array. Market requests have symbol, interval and limit validation.
- SMC modules contain three-candle swing detection, structure classification, close-based BOS, CHoCH, equal highs/lows, and UTC previous-day high/low aggregation. Their existence does not imply correctness; see findings below.
- React dashboard has market/timeframe/limit controls, loading/error states, candle statistics, a table and a lightweight-charts v5 candlestick chart. The chart uses `addSeries(CandlestickSeries, {})`, correct candle mapping, and scoped resize cleanup.
- Equal-level detection correctly appends to the results array and uses numeric tolerance.
- Only Binance crypto markets are connected. FX/OANDA, TradingView service, timeframe conversion, indicators, database models and backtesting modules are empty placeholders. Sweeps, OBs, FVGs, POIs, HTF/LTF confirmation, entry validation and risk simulation are not implemented. The frontend does not consume SMC results or draw SMC overlays.

## Confirmed defects and limitations

| Priority | Location                                             | Finding                                                                                                                                                                                                                    |
| -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | `server/middleware/ValidateMarketRequest.js:42`      | `res.statuus` makes invalid limits return HTTP 500 HTML instead of HTTP 400 JSON. Reproduced with `limit=0`.                                                                                                               |
| High     | `server/controllers/SMCController.js:25`             | Calls `detectLiquidity(swings)` without candles; previous-day liquidity silently returns `[]`. Direct invocation with candles works.                                                                                       |
| High     | `server/smc/StructureDetector.js`                    | Compares only adjacent same-type swings. An alternating HIGH/LOW/HIGH/LOW fixture produces no structure classifications.                                                                                                   |
| High     | `server/smc/CHOCHDetector.js`                        | Bearish events read nonexistent `current.current`, losing the candle. Transition checks alone do not establish a meaningful trend reversal or a close beyond relevant structure. The intended rule requires clarification. |
| Medium   | `server/controllers/SMCController.js`                | Hard-codes BTCUSDT/1h/100; supplied query parameters are ignored. Verified with a stubbed provider.                                                                                                                        |
| Medium   | `server/market/DataCleaner.js`                       | Malformed rows can produce NaN; no finite-value/OHLC validation, sorting, deduplication, gap handling or incomplete-candle exclusion.                                                                                      |
| Medium   | `server/smc/BOSDetector.js`                          | Bullish `brokenSwings` versus bearish `brokenSwing`; output follows swing traversal rather than guaranteed break chronology. Every breached swing can generate an event without continuation/reversal context.             |
| Medium   | Swing and previous-day detectors                     | Swings require a future neighbor but have no confirmation-time field. Daily aggregation accepts partial days and uses the preceding available UTC date. These semantics need resolution before chronological backtesting.  |
| Medium   | `client/src/components/market/TimeframeSelector.jsx` | Options have no visible text.                                                                                                                                                                                              |
| Medium   | `client/src/pages/Home.jsx`                          | On a request error, the early return removes controls and the retry button. Initial effect has a dependency warning and no cancellation/stale-response handling.                                                           |
| Medium   | `client/src/services/MarketService.js`               | Imports `MarketApi`, while the filename is `marketApi.js`: a case-sensitive deployment portability defect. Windows build passes.                                                                                           |
| Medium   | Frontend configuration                               | API base URL is hard-coded to localhost. Client imports Axios but does not declare it in its own package; this checkout resolves the root dependency.                                                                      |
| Low      | Layout                                               | `layouts/layout.css` is not imported; several selectors are not applied by components and `.statisctics` is misspelled.                                                                                                    |

## Security and repository hygiene

- Tracked `docs/Architecture.md` contains plaintext API-key/secret-like values. Their validity was not tested and the values are intentionally omitted here. If real, revoke/rotate them at the provider; deleting text alone does not remove historical exposure.
- Root `.gitignore` is a directory, not an ignore file. Root Git tracks 811 files under `node_modules` and also tracks `server/.env`. That environment file currently contains PORT and NODE_ENV only; tracking it creates a future secret-exposure risk.
- The API has unrestricted CORS, no request throttling, and no outbound Binance timeout. Controllers return exception messages; the invalid-limit request exposed Express's HTML stack response under the local test configuration.
- `server/` contains a nested Git repository while its files are also tracked by the root repository. Nested Git already reports modified controller/liquidity files and an untracked previous-day detector. Preserve these pre-existing changes and clarify repository ownership before commits.
- No dependency vulnerability scan or provider account review was performed; this is a source-level baseline, not a complete security audit.

## Duplicate/dead code and documentation

- Root/server package manifests duplicate the backend package; root/server READMEs duplicate project planning text. Backend entry points declare nonexistent `index.js` and provide no start script.
- Unused scaffolding includes `App.css`, starter React/Vite assets, empty common Button/Loading components, empty SMC barrel, and the future backend modules above. Commented startup code remains in `server.js`.
- API docs omit the SMC endpoint. Roadmap/README/strategy status is inconsistent with implemented code. Strategy.md is mainly headings, not an executable strategy specification.
- Documentation claims shared swing configuration and average liquidity prices, but SwingDetector does not read smcConfig and equal-level results contain pairs only.
- Stage 01 is not defined in the existing documents. The handoff's postponed standard event model and its working OB definition remain authoritative constraints.

## Validation performed

- Node v22.18.0; `npm.cmd --prefix client run build`: passed on Windows.
- `npm.cmd --prefix client run lint`: completed with one missing-effect-dependency warning in Home.jsx.
- Root and server `npm test`: both fail deliberately with `Error: no test specified`. Application test directories are empty; no frontend test script exists.
- Temporary in-memory assertions confirmed valid candle conversion, direct previous-day aggregation and equal-level detection; reproduced missing alternating structure, undefined bearish CHoCH candle and accepted NaN input.
- A temporary local Express server with a stubbed Binance provider returned 200 for `/` and `/api/candles`, 400 for invalid interval, and 500 HTML for invalid limit. SMC returned 200 but ignored requested market parameters and omitted previous-day liquidity. The temporary server was closed; no test source files were added.
- Live Binance access and browser rendering were not verified. The build alone does not establish visual or trading correctness.

## Proposed Stage 01 — pending approval

Stabilize the existing application: repair invalid-limit handling, missing liquidity input, the CHoCH candle typo, frontend import casing, timeframe labels and error recovery; establish targeted automated regression tests and update current API/setup documentation. Address exposed credential text and ignore-file hygiene without rewriting Git history or discarding nested-repository changes. Keep strategy-semantic changes separate until rules are agreed.

Before later engine work, clarify relevant structural swing selection, equal-price classification, continuation BOS versus CHoCH, swing confirmation availability, and the trading-day/session boundary and partial-day policy. Do not introduce a standard event model or encode new trading rules in Stage 01.

Commands to repeat now from the repository root:

```powershell
npm.cmd --prefix client run build
npm.cmd --prefix client run lint
npm.cmd test
npm.cmd --prefix server test
```

The last two are expected to fail until a test suite is added. Stage 01 should add repeatable tests for request validation, candle conversion, controller parameter/data forwarding and the confirmed regressions.

Changes from this review: this report only, plus ignored frontend build output. No application code, dependencies or strategy rules changed. No commit or push performed. Approval is required before Stage 01, per Handoff.txt.

---

## Append-only audit: pre-Stage 01 application repairs

**When:** 2026-09-18, Africa/Kampala (UTC+03:00), work and checks performed approximately 00:33–00:50.

**Authorization and purpose:** The user requested application repairs before Stage 01 and explicitly required keeping every original baseline entry while adding how, where, what, when, and why fixes were made. The original report above remains historical evidence. This section updates its status without replacing it. Stage 01 remains unstarted.

**Starting state:** The user had already corrected `res.statuus` to `res.status`, renamed the `.statisctics` CSS selector, and edited `server/.env` and `docs/Architecture.md`. Those changes were preserved. The former `.gitignore` directory was already absent. The nested server repository and its existing changes were preserved. No credential values are reproduced here.

### Repair register

All entries below were implemented and checked on the date above. "Fixed" describes the stated defect only, not a completed production or trading-engine audit.

| ID / status                                               | What and where                                                                                                                                      | How it was fixed                                                                                                                                                                                                            | Why / resulting behavior                                                                                                                                                                             | Evidence                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 — Fixed                                               | Query validation: `server/middleware/ValidateMarketRequest.js`, both controllers and `server/routes/smcRoutes.js`                                   | Preserved the user's status-method correction; corrected the integer error message; used shared defaults; rejected non-scalar parameters; stored normalized values in `req.marketQuery`; applied middleware to both routes. | Express 5 query mutation did not reliably preserve numeric conversion. Both endpoints now validate before provider access and forward a numeric limit. Invalid limits return 400 JSON.               | API tests cover defaults, custom selections, both boundaries, malformed/repeated parameters and no provider calls on invalid input. Live invalid-limit check returned 400.                                                                                                                                                                |
| R02 — Fixed                                               | SMC input forwarding: `server/controllers/SMCController.js`                                                                                         | Replaced hard-coded BTCUSDT/1h/100 with validated request values and called `detectLiquidity(swings, candles)`.                                                                                                             | Selected markets/timeframes now reach Binance, and previous-day liquidity is calculated from available candles instead of silently returning an empty list.                                          | Stubbed integration test verifies exact previous-day values. Live ETHUSDT/5m/100 request returned 200, 39 swings and 100 previous-day rows. Counts are a point-in-time observation.                                                                                                                                                       |
| R03 — Fixed implementation defect; semantics retained     | Structure comparisons: `server/smc/StructureDetector.js`                                                                                            | Retained a preceding swing per type and applied the existing greater-than comparisons against it.                                                                                                                           | Alternating HIGH/LOW swings now produce HH/HL/LH/LL labels instead of being skipped. Equal prices still use the existing LH/LL outcomes; no protected-swing or trend-selection rule was added.       | Alternating fixture returns HH, HL, LH, LL; consecutive, equal-price, empty-input and non-mutation checks pass.                                                                                                                                                                                                                           |
| R04 — Fixed candle reference only                         | `server/smc/CHOCHDetector.js`                                                                                                                       | Replaced `current.current` with `current.candle` and used strict comparison consistently.                                                                                                                                   | Bearish events retain the candle just as bullish events do. The existing adjacent-label transition algorithm is unchanged.                                                                           | Both existing transition fixtures assert the full event and source candle. Meaningful reversal semantics remain unresolved below.                                                                                                                                                                                                         |
| R05 — Fixed compatibility and ordering                    | `server/smc/BOSDetector.js`                                                                                                                         | Added bullish `brokenSwing`, retained legacy `brokenSwings`, and sorted results by `breakIndex`.                                                                                                                            | Consumers can read one common reference field and chronological break indices without losing the old bullish field. Existing close-beyond-level detection is preserved.                              | Test verifies no wick-only/equal-close break, first subsequent close break, both references and chronological ordering. No standard event model introduced.                                                                                                                                                                               |
| R06 — Fixed malformed-data handling                       | `server/market/DataCleaner.js`                                                                                                                      | Validate row shape, nonempty numeric fields, finite values, valid millisecond timestamps, positive prices, consistent OHLC bounds and nonnegative volume; reject duplicate or reversed timestamps.                          | Invalid numbers and ordering no longer reach the chart as NaN/null or cause duplicate-time assertions. Data is rejected explicitly; candles are not silently sorted, dropped or synthesized.         | Conversion, non-mutation, malformed-row/numeric/OHLC and timestamp-order tests pass. Live Binance data passes these checks. These checks target the currently supported Binance spot data.                                                                                                                                                |
| R07 — Fixed unbounded provider wait                       | `server/market/BinanceService.js`                                                                                                                   | Set an 8-second Axios timeout while retaining the existing public failure message.                                                                                                                                          | Backend requests no longer wait indefinitely after the frontend's 10-second timeout.                                                                                                                 | Stubbed provider tests verify request options, parameter forwarding and failure translation; live requests succeeded.                                                                                                                                                                                                                     |
| R08 — Fixed visible controls and retry path               | `client/src/components/market/TimeframeSelector.jsx`, `LimitSelector.jsx`, `pages/Home.jsx`, `services/MarketService.js`, `api/marketApi.js`        | Render option labels; align limits to 1–1000; keep errors inside the dashboard; pass AbortSignal through the API layer; cancel obsolete/unmounted requests; make the initial-load callback stable.                          | Users retain controls and prior data after a failed load. Stale/cancelled requests do not update state. Changing a selector still requires Load Market, except for the initial load.                 | Rendered-component tests confirm option labels, limit attributes and controls. Lint has no effect warning. Browser interaction and cancellation behavior have not been exercised in a real browser in this session.                                                                                                                       |
| R09 — Fixed layout wiring                                 | `client/src/components/layout/{DashboardLayout,Navbar,Sidebar}.jsx`, `pages/Home.jsx`, `layouts/layout.css`, `charts/CandleChart.jsx`               | Import layout CSS; attach existing classes; retain the user's `.statistics` correction; add bounded grid/table sizing and a single-column breakpoint; fit chart data and observe container resizing with cleanup.           | The existing dashboard layout is now active, table overflow is contained, and chart width responds to container changes as well as window resize. The lightweight-charts v5 series API is preserved. | Dashboard markup and production build pass. Visual layout, mobile sizing and canvas rendering require the manual browser checks in Development.md.                                                                                                                                                                                        |
| R10 — Fixed frontend packaging and API configuration      | `client/src/services/MarketService.js`, `api/axios.js`, `api/marketApi.js`, `vite.config.js`, `package.json`, `package-lock.json`, `.env.example`   | Match import filename case; declare/install Axios; align the API helper's default limit to 100; default to same-origin `/api`; add configurable Vite dev/preview proxy and optional public API base URL.                    | Standalone client installs declare their own HTTP dependency, case-sensitive import resolution is corrected, and the browser no longer assumes its own localhost is the deployed API.                | Build/lint pass; real Binance requests succeed through the Vite proxy. npm added 30 lockfile entries for dependencies/optional peer metadata and updated optional `@emnapi/wasi-threads` from 1.2.2 to 1.2.3. Offline installation lacked cache metadata; the approved online install succeeded. A fresh Linux install/build was not run. |
| R11 — Fixed startup commands and local environment lookup | Root/server `package.json`, `server/server.js`, `server/.env.example`                                                                               | Add start scripts, point package entry fields at the real app modules, explicitly load `server/.env`, default to port 5000 and validate the port range.                                                                     | Startup works from root or server without depending on the shell's current directory for dotenv. Existing environment variables override the file.                                                   | Started the actual server from the root with PORT=5015 for isolated live checks; current user environment files were not rewritten.                                                                                                                                                                                                       |
| R12 — Added regression coverage                           | `tests/api/market.test.js`, `tests/market/data.test.js`, `tests/strategy/detectors.test.js`, `client/tests/dashboard.test.js`, package test scripts | Use Node's built-in test runner, in-process provider stubs, temporary local HTTP servers, and Vite/React server rendering for frontend markup.                                                                              | Previous placeholder test commands now provide repeatable checks without requiring Binance for regression runs.                                                                                      | 22 backend tests pass via both root and server commands; four frontend checks pass. Frontend server rendering does not substitute for browser tests.                                                                                                                                                                                      |
| R13 — Partially addressed repository hygiene              | Root `.gitignore`, client/server `.env.example`, `docs/API.md`, `docs/Development.md`                                                               | Added a real ignore file for future dependency/build/environment/log files, non-secret environment examples, and current setup/API/test documentation.                                                                      | Future untracked environment files and generated files have an ignore policy; setup and API behavior are documented.                                                                                 | Ignore patterns and working diff reviewed. Already tracked `node_modules` and `server/.env` remain tracked; no index/history changes were made.                                                                                                                                                                                           |

### Verification record

Commands run from the repository root:

```powershell
npm.cmd test
npm.cmd --prefix server test
npm.cmd --prefix client test
npm.cmd --prefix client run lint
npm.cmd --prefix client run build
git diff --check
```

Results: 22/22 backend tests passed (the root and server commands run the same suite); 4/4 frontend checks passed; lint completed without warnings; production build succeeded; whitespace check passed. No persistent test dependency was added beyond the missing production Axios dependency.

Live smoke checks used the actual backend on temporary port 5015 and Vite on 5175 with `API_PROXY_TARGET=http://127.0.0.1:5015`:

- `/api/candles?symbol=BTCUSDT&interval=1h&limit=10`: HTTP 200, success true, 10 candles.
- `/api/candles?limit=0`: HTTP 400 JSON with the integer-range message.
- `/api/smc/swings?symbol=ETHUSDT&interval=5m&limit=100`: HTTP 200, success true, requested market forwarded and previous-day rows present.

Browser automation returned "No browser is available". No browser screenshot, click-based retry test or visual inspection is claimed. Development.md contains the manual load/change/error/retry/resize checks to run in a connected browser.

### Remaining findings and boundaries

- CHoCH's strategy meaning, protected/relevant swings, BOS continuation/reversal distinctions, equal-price classification policy, swing confirmation availability and day/session/partial-day policy still need agreed strategy rules. The current CHoCH algorithm still only checks adjacent structure labels. No permanent new trading interpretation was encoded.
- Previous-day extrema still use available UTC candles, including partial days. Current/open-candle exclusion, gap handling, HTF/LTF processing and look-ahead-safe replay remain future work. A successful SMC response is not validation of a backtest-ready engine.
- Historical credential exposure is not resolved by editing the working documentation. The user's architecture edits removed the credential-labelled lines from the current file; provider validity/rotation and Git history were not inspected or changed.
- Tracked dependencies/environment files, nested repository ownership, unrestricted CORS, request throttling and general production security remain outstanding. Adding `.gitignore` does not untrack files. Generic controller exception-message handling is unchanged; the repaired invalid-limit path no longer produces an Express stack response.
- Empty future modules, duplicate package/README scaffolding and old roadmap/strategy sections remain as recorded above. Features such as OB/FVG detection, entry validation and actual backtesting were not added. Existing documentation was extended rather than rewritten.
- No commit or push was made in this pre-stage repair pass. User-owned edits were not staged, discarded or overwritten. Stage 01 still awaits its own approval.

**Content-preservation verification:** The original 8,620-byte report was compared byte-for-byte against the prefix of this file after the audit was appended; it matched exactly. SHA-256 of that original prefix: `a9352fbfddd8e77b3e464937acd02605550345ff1b22d7c5366c13a04826147b`. The temporary live-check server processes were stopped after verification.

---

## Stage 01 — Baseline audit, 2026-09-18

**Authorization / when:** The user requested moving to Stage 01. `Stage01.txt` defines this stage as auditing the existing app, fixing only obvious blocking problems, updating Agile/Roadmap, and stopping before Stage 02. Checks were performed on 2026-09-18, Africa/Kampala (UTC+03:00), beginning approximately 01:01.

**Scope and attribution:** The earlier application repairs are the pre-stage work recorded above. Stage 01 does not claim them as new changes. This stage re-inspected source/packages/docs/imports/exports, re-ran tests, started both apps, checked the required live endpoints, and recorded remaining defects. No further application-code blocker was found; no runtime strategy or UI behavior was changed. The security action prepared for finalization is to stop tracking `server/.env` in the root repository while preserving its local contents. Existing root Git is used for the full-stack stage record; the nested server repository is left intact.

### Working features and live evidence

Express was started through `npm.cmd start` with temporary PORT=5015; Vite through its dev script on 5175 with API_PROXY_TARGET pointing to 5015. This avoided altering saved environment settings or relying on another running process.

| Required check                                          | Observed result and assertions                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`                                                 | HTTP 200 JSON, exactly `{ "status": "Server running" }`.                                                                                                                                                                                                                                                             |
| `GET /api/candles?symbol=BTCUSDT&interval=1h&limit=100` | HTTP 200, success true, BTCUSDT/1h metadata, total/data length both 100 and parseable response timestamp. All 100 rows have exactly `time`, `open`, `high`, `low`, `close`, `volume`, finite numeric values, valid OHLC bounds and strictly increasing millisecond timestamps.                                       |
| `GET /api/smc/swings`                                   | HTTP 200, expected top-level fields, 49 swings, 47 structure labels, 27 BOS events, three CHoCH events, two equal-high pairs, zero equal-low pairs and 100 previous-day rows at this observation. Counts vary with live data.                                                                                        |
| SMC record validation                                   | Present swing indices/types/candles, HH/HL/LH/LL labels, event directions/indices/prices, chronological BOS indices and bullish alias, CHoCH candles, equal-level pair types, and previous-day numeric/null/date fields passed assertions. Empty arrays are valid API output, not proof that a detector is complete. |
| Frontend runtime                                        | HTTP 200 for Vite HTML and the transformed entry module; `/api` proxy returned 100 valid live candles. Invalid limit through the proxy returned HTTP 400 JSON.                                                                                                                                                       |

Existing functionality includes Binance crypto loading, cleaned data, request validation, dashboard component composition and initial SMC algorithms. This remains a market-data/analysis prototype; the project does not yet perform FX backtests.

### Broken or incomplete behavior

- **CHoCH semantics:** The algorithm compares adjacent classified records only. A fixture yielding HH, HL, LH, LL returns no CHoCH because the low-to-low transition is interrupted by a high record. Fixing which transitions constitute a meaningful reversal requires agreed strategy rules, so Stage 01 records the limitation without inventing a rule.
- **Availability and look-ahead:** Three-candle swings need a following candle but expose no confirmation time. Open Binance candles can still enter analysis; there is no chronological replay contract. BOS lacks continuation/reversal context.
- **Daily liquidity completeness:** Previous-day output uses the preceding available UTC date, including partial observations. Higher-than-daily candles do not provide actual daily extrema. Session/calendar/day-coverage rules remain unspecified.
- **Missing features:** SMC overlays, OB/FVG/POI, sweeps, HTF/LTF entry validation, risk simulation, actual trade/backtest/statistics engines, OANDA/FX, persistence and provider conversion are unimplemented, not broken completed features.
- **Frontend validation boundary:** Home, StatisticsPanel and the chart trust the successful API payload; there is no client-side response-schema guard. Real-browser retry, cancellation, canvas cleanup and responsive behavior are unverified. Error messages from network failures may remain generic.

### Warnings, technical debt and source inspection

- Frontend lint passes without warnings. An additional `oxlint server shared tests` scan reports **18 empty-file warnings** only. No undefined-variable issue was reported by these checks; this is not a proof that all runtime branches are safe.
- Reviewed 62 source/style files and 42 relative-import text matches. The only unresolved text match was an obsolete **commented-out** import in DetectEqualLevels; it is not executed. Active local imports resolved with matching case. Nonempty backend module exports loaded successfully, and the frontend build/SSR tests exercised its module graph.
- Unreachable source files comprise 18 backend placeholders, two empty common UI components and unimported `App.css`. The backend placeholders are six backtesting files, four indicators, four models, OandaService, TradingViewService, TimeframeConverter and `smc/index.js`. Starter image/SVG assets and public template assets remain unused or template leftovers.
- Root/server READMEs are byte-identical. Root/server backend dependency manifests duplicate configuration, and commented old startup/import code remains. These are recorded rather than refactored in an audit stage.
- Naming is inconsistent: StatisticsPanel exports StatisticalPanel, MarketRoutes and smcRoutes use different casing conventions, and CHOCH differs from the documentation's CHoCH spelling. Existing default exports resolve correctly. The bullish BOS plural alias is intentional compatibility debt.
- Direct detector calls do not uniformly validate their input. Routed analysis relies on DataCleaner; some missing inputs still become empty results. Unexpected/unknown route errors use Express defaults, and upstream error classification/retries are limited. No authentication/rate limiting or production error middleware is implemented.
- The backend shared equal-level helper imports server configuration directly. Shared configuration does not currently govern the swing window, despite earlier documentation claims.

### Security correction and scoped action

Earlier notes identified active PORT/NODE_ENV assignments but did not account for credential-like **comments** in `server/.env`. The Stage 01 inspection found two long credential-like values in comments at lines 4–5. Comments remain file content and can be committed. This corrects the earlier security assessment without changing the historical text above; no values are reproduced here.

The root `.gitignore` already excludes environment files, but it cannot protect files that are still tracked. The scoped action is `git rm --cached -- server/.env`: remove the file from the root index while keeping the local configuration and comments intact. The `.env.example` remains tracked. The existing nested server Git repository still requires separate handling and must not be treated as cleaned by a parent-repository action. The final Git outcome is appended below after verification.

No credential-pattern matches were found in the selected working source/docs/config-example files during a limited scan. This does not validate the credentials or audit history. If the old credentials are real, provider-side revocation/rotation is still needed. Historical documentation exposure, 811 tracked root dependency files, unrestricted CORS, absent request throttling, nested repository ownership and general production security remain outstanding. No vulnerability-database, penetration, provider-account or Git-history remediation was performed.

### Tests run and missing coverage

| Check                                                     | Result                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm.cmd test`                                            | 22 backend tests pass.                                                                                    |
| `npm.cmd --prefix client test`                            | Four frontend rendered-component/data-mapping tests pass.                                                 |
| `npm.cmd --prefix client run lint`                        | Pass, no warnings.                                                                                        |
| `npm.cmd --prefix client run build`                       | Pass.                                                                                                     |
| `client/node_modules/.bin/oxlint.cmd server shared tests` | No errors; 18 known empty-placeholder warnings.                                                           |
| Live endpoint and response assertions                     | Required root/candle/SMC checks plus frontend/proxy checks pass as detailed above.                        |
| Browser availability                                      | Connected-surface inventory returned no apps or browsers. Visual/interaction verification is unavailable. |

Still missing: real-browser load/change/error/retry/resize/cancellation tests; chronological swing/BOS/CHoCH availability and repainting tests; partial/missing days, weeks, sessions and higher-timeframe daily-level cases; property/boundary tests for equal-level grouping and malformed detector inputs; actual provider timeout/retry/rate-limit behavior; API malformed-payload/unknown-route/global-error contracts; client response-schema failure handling; reproducible clean Linux installation/build and deployment checks. Future unimplemented backtesting modules have no tests because their behavior is not defined yet.

### Documentation changes and next step

**What/where/how/why:** Updated `docs/Agile.md` with the Stage 01 objective, executed checks, results, limitations and completion assessment; updated `docs/Roadmap.md` with an actual implementation matrix and corrections to old status claims. Historical sections were retained and marked as such. Appended this dated audit to Baseline.md to preserve the repair history and distinguish verified behavior from planned functionality. `Handoff.txt` and `Stage01.txt` document the authorized workflow/scope.

**Recommended next implementation step:** Agree candle availability/open-candle policy, swing confirmation timing, relevant structural comparisons and trading-day boundaries, then add deterministic chronological tests before extending structure/BOS/CHoCH behavior. This is a recommendation, not authorization to implement a guessed Stage 02. No OB/FVG, entry logic or standard event model is introduced.

**Stage outcome:** Audit work and required runtime checks are complete with the limitations recorded above. Stage 02 is not implemented and requires user approval. Commit/push finalization follows the Handoff workflow; its actual result is recorded after the Git operations.

**Stage 01 finalization verification:** Root-index removal of `server/.env` succeeded; its local SHA-256 was unchanged before/after the operation, `git ls-files` no longer lists it, and the ignore rule matches it. A limited credential-pattern scan of the staged non-lockfile contents returned no findings; no vendor files were staged. The entire pre-Stage-01 Baseline.md prefix (20,946 bytes, SHA-256 `d0c6d390b25c91c6f56c7fab10ced3fcaabe778a7d751b2fbd311ebac4ad58a7`) remains unchanged. The stage commit includes the previously uncommitted authorized repair work and this audit so the documented baseline is reproducible. Exact commit/push identifiers and publication success are reported in the completion response and Git history, rather than embedding a self-referential commit hash in this file.

---

## Stage 02 — Market-data audit and corrections, 2026-09-18

**When/authorization:** Work began approximately 01:54 Africa/Kampala (UTC+03:00) on 2026-09-18 after the user's Stage02 request. Stage02.txt restricts work to the market-data foundation and explicitly requires stopping without a commit/push. The earlier 42-file repair/audit commit is not part of this new diff.

**Inspection:** Read the required current documentation and audited BinanceService, DataCleaner, MarketController, MarketRoutes, ValidateMarketRequest, MarketConfig and related tests. The fixed Binance Spot URL, query names, timestamp units and raw candle positions were checked against the [official Binance REST specification](https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md#klinecandlestick-data). Existing application defaults and interval choices were retained.

### Factual corrections to the previous baseline

- Malformed-data rejection previously missed sparse in-memory arrays: `cleanCandles(new Array(1))` serialized as `[null]` because Array.map skipped the absent entry. Ordinary JSON cannot represent a sparse array, but direct callers or an adapter could still supply one. Missing entries are now validated and rejected.
- MarketController previously returned arbitrary dependency exception messages. A targeted test returned a private message and stack-like text verbatim. Its catch block now always returns the existing generic market-data failure message.
- BinanceService previously accepted non-array response bodies until a downstream cleaner rejected them, and its error logger could itself throw when a rejection value was null/undefined. Both cases now fail at the service boundary with the fixed public error.
- An actual Axios response timeout is now tested using a stalled loopback HTTP server, taking approximately eight seconds. This improves on the earlier option-only check; DNS/TLS/network-path behavior against a stalled real Binance server is not claimed.

### What changed, where, how and why

| File                                     | Purpose and implementation                                                                                                                                                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/market/BinanceService.js`        | Use existing MarketConfig defaults; reject missing/non-array bodies; retain genuine empty arrays; sanitize all rejections without reading untrusted error properties. Fixed URL and 8,000 ms timeout unchanged.                                            |
| `server/market/DataCleaner.js`           | Use Array.from with the existing row validator so absent array entries cannot escape validation. All existing numeric/OHLC/order checks and reject-rather-than-repair behavior remain.                                                                     |
| `server/controllers/MarketController.js` | Replace arbitrary exception-message output with the existing fixed public message and generic logging. Preserve HTTP 500 and the existing error envelope.                                                                                                  |
| `tests/market/data.test.js`              | Add nine focused checks covering numeric conversion, invalid/missing fields/timestamps, sparse data, shared defaults, empty/malformed responses, unusual rejections and real timeout behavior. Tighten the original timeout assertion to exactly 8,000 ms. |
| `tests/api/market-pipeline.test.js`      | Add 11 complete-pipeline checks that stub only Axios, retaining real route/middleware/controller/service/cleaner execution. Cover all required success, validation, empty, malformed, ordering, provider-error and unexpected controller-failure cases.    |
| `docs/API.md`                            | Append the actual market-data request/success/empty/error contract, compatibility choices, source verification and test evidence.                                                                                                                          |
| `docs/Architecture.md`                   | Append current provider-to-response flow, failure boundaries, test isolation and market-data limitations.                                                                                                                                                  |
| `docs/Agile.md`                          | Update the current checkpoint and append stage scope, changes, test results and audit-pending status.                                                                                                                                                      |
| `docs/Roadmap.md`                        | Update the current checkpoint and append the actual market-data state, remaining scope and stop condition.                                                                                                                                                 |
| `docs/Baseline.md`                       | Append this dated correction and audit record; previous text remains unchanged.                                                                                                                                                                            |

MarketRoutes, ValidateMarketRequest and MarketConfig needed no edits: tests confirm their existing wiring, accepted inputs and normalization. No client source, dependency manifest/lockfile, environment file, SMC controller/detector or strategy test changed in this stage. No new packages were installed. The shared service/cleaner still feed the SMC endpoint, but no strategy algorithm or event model changed.

### Tests and observed results

- Before implementation: the existing 22 backend tests passed. Five selected new regression tests failed against the old implementation, reproducing missing-row acceptance, malformed envelope acceptance, unsafe non-Error rejection handling and controller message exposure.
- After implementation: `npm.cmd test` and `npm.cmd --prefix server test` each passed **42 backend tests**. They run the same suite and are not counted twice. Twenty tests were added: nine cleaner/provider checks plus 11 complete-pipeline checks.
- `npm.cmd --prefix client test`: **4/4 pass**. `npm.cmd --prefix client run lint` and `npm.cmd --prefix client run build`: pass. These were API-consumer regression checks; no browser interaction is claimed.
- Oxlint on the three modified runtime files and two stage test files: clean after expressing intentional sparse fixtures with explicit deletion instead of sparse-array literals. The two affected sparse-array tests were checked again after that fixture-only edit.
- Live backend on temporary port 5015: BTCUSDT/1h/100 returned HTTP 200 with 100 validated records; ETHUSDT/5m/2 returned HTTP 200 with two records. Invalid symbol, interval and limit returned their exact 400 JSON messages. `NOTAREALSYMBOL` passed format validation, was rejected upstream and returned the fixed 500 message without provider details.
- Empty/malformed datasets and provider 400/429/500/timeout/network failures were exercised using isolated fixtures, not by inducing real provider failures. A separate actual stalled local HTTP response confirmed Axios timeout enforcement with the production 8,000 ms option unchanged.

### Assumptions retained and unresolved market-data work

- A genuine provider [] means a successful empty result; missing/non-array bodies are failures. The existing 200/400/500 categories and `{ success, message }` error keys remain; no new response schema or error classification is introduced.
- Limits still use Number conversion, including existing forms such as exponent/hex/whitespace numeric strings that normalize to an integer. The 15-interval allowlist and uppercase ASCII alphanumeric symbol rule remain application choices; no exchange-wide symbol catalogue or new interval support is added.
- Positive finite prices, nonnegative finite volume, valid millisecond timestamps and strictly increasing order remain the supported spot-data assumptions. Fewer rows than requested are allowed. No sorting, filtering, duplicate removal or synthetic rows are introduced.
- Direct service callers must supply validated inputs; routed callers obtain validation through middleware. Error logs in the changed catch blocks are deliberately generic, so detailed structured diagnostics remain future work.
- Open/current candles, gap handling, historical pagination, day/session coverage, decimal precision, retry/backoff/rate-limit coordination, cancellation propagation to Binance and detailed upstream error statuses remain unresolved. Generic failures still map to 500, including valid-format but unlisted symbols. Errors outside MarketController's handler (including pre-route Express errors) and unrelated controller error handling are outside this stage.

**Status:** Implementation/test work is ready for the user's audit. Working-tree changes are intentionally uncommitted, alongside the user's pre-existing untracked stage instruction files. Nothing was staged, committed or pushed. Stage 03 has not started.

## Stage 03 — Market-structure engine, 2026-09-19

**Status:** Complete and locally verified.

**What was implemented:** deterministic three-candle swings with explicit confirmation timing, same-type `HH`/`LH`/`HL`/`LL` structure classification, close-based BOS in an established trend, and protected-swing CHoCH detection.

**Test evidence:** the strategy suite verifies bullish and bearish structure logic, reversal behavior, BOS/CHoCH timing and ordering, empty/insufficient input handling, equal-price ambiguity, source-candle retention, and chronological availability constraints.

**Scope boundary:** this stage does not include Stage 04 liquidity core work, open-candle policy decisions, or any backtesting logic.

## Stage 04 — Liquidity core, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** configurable equal-high and equal-low detection using a numeric tolerance, swing-liquidity outputs, previous-day and previous-week liquidity windows, and session liquidity with explicit timezone/session configuration.

**Key safeguards:** the implementation uses only historical candles, avoids lookahead, preserves configuration immutability, and remains deterministic for a fixed candle set.

**Test evidence:** the strategy suite verifies equal-level tolerance boundaries, non-equal values, swing liquidity output, previous-day/week boundaries, and session calculations.

**Scope boundary:** this stage remains limited to liquidity-core detection and does not include sweep detection, OB/FVG logic, or future backtesting work.

## Stage 05 — Liquidity sweep detection, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** detected when price takes liquidity and rejects or reclaims a relevant level, with SSL/BSL context, sweep candle metadata, directional state, confirmation/reclaim checks and false/failed sweep coverage. No future-candle access is used.

**Test evidence:** the strategy suite verifies bullish and bearish sweep/reclaim behavior, failed sweeps, and historical-only confirmation timing without lookahead.

**Scope boundary:** this stage remains limited to liquidity sweep detection and does not include Stage 06 work or any new backtesting logic.

## Stage 06 — Order block engine, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** detected order blocks using the project's working definition: after a directional shift, price creates an imbalance and takes out the previous candle high/low, and the detector reports the directional zone and candle reference without lookahead. The detector also rejects invalid/insufficient patterns and prevents overlapping zones.

**Test evidence:** the strategy suite verifies bullish and bearish order blocks, invalid/insufficient cases, and overlapping-zone rejection using historical-only conditions.

**Scope boundary:** this stage remains limited to order-block detection and does not include entry logic, FVG/POI work, or future backtesting logic.

## Stage 07 — Fair value gap detection, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** detected bullish and bearish historical-only FVG/imbalance windows based on the gap relation between successive candles, without using future candles or lookahead.

**Test evidence:** the strategy suite verifies bullish and bearish gaps and the deterministic relationship between successive candles.

**Scope boundary:** this stage remains limited to FVG detection and does not include POI, HTF/LTF logic, or entry validation.

## Stage 08 — Points of interest, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** supplied a deterministic POI detector that filters valid directional FVG and liquidity references into a curated points-of-interest list without inventing unsupported entries.

**Test evidence:** the strategy suite verifies only valid directional POIs are retained while invalid or unsupported items are dropped.

**Scope boundary:** this stage remains limited to POI aggregation and does not include confluence or trade entry validation.

## Stage 09 — HTF / LTF analysis, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** added a directional confluence check that compares HTF and LTF bias and reports whether the contexts align without introducing future-aware assumptions.

**Test evidence:** the strategy suite verifies alignment only when the HTF and LTF directional bias agrees.

**Scope boundary:** this stage remains limited to confluence reporting and does not include risk-based execution checks.

## Stage 10 — Entry validation, 2026-09-23

**Status:** Complete and locally verified.

**What was implemented:** added a validation helper for trade ideas that checks direction, POI support, confluence and risk structure in a deterministic historical-only manner.

**Test evidence:** the strategy suite verifies that a bullish entry is accepted only when the POI, confluence and risk structure are all consistent.

**Scope boundary:** this stage remains limited to validation logic and does not include live execution or backtesting automation.
