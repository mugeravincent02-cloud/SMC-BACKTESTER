# 1. Project Vision

> Current status (2026-09-19): Stage 03 market-structure implementation and verification are complete locally. Earlier sprint/phase and Stage 01/02 entries below are preserved history.

    Current Sprint

    Sprint: 1

    Goal:
    Build the application foundation.

    Tasks

    ☐ React setup

    ☐ Express setup

    ☐ Folder structure

    ☐ GitHub repository

    Progress

    25%

    client/
    src/
        main.jsx
            Starts the React application.

            # Responsibilities:

            Render <App />
            Import global CSS
        App.jsx
          Your temporary homepage:
            Smart Money Backtester

            [Connect]

            Status: Connected

    server/
        server.js
            Starts Express.

            Responsibilities:

                Start server
                Listen on port
                Print: Server running on port 5000
        app.js
            Configure Express.

                Responsibilities:

                express()
                middleware
                routes (later)

README.md

# 2. Project Goals

# 3. Development Philosophy

# 4. Technology Stack

# 5. Milestones

# 6. Sprint Roadmap

# 7. Current Sprint

# 8. Future Features

# . Version History

# 10. Definition of Done

# Update as of Phase 2

# Roadmap

## Phase 1 - Foundation

### Sprint 1

- ✅ Project architecture
- ✅ Folder structure
- ✅ Express backend setup
- ✅ React frontend setup
- ✅ Documentation created

### Sprint 2

- ✅ Binance API integration
- ✅ Axios configured
- ✅ DataCleaner module
- ✅ MarketController
- ✅ Market routes
- ✅ Live candle endpoint
- ✅ Configuration file
- ✅ Market validation middleware

### Sprint 3

- [ ] React API connection
- [ ] Dashboard
- [ ] Market selector
- [ ] Timeframe selector
- [ ] Candle table

### Sprint 4

- [ ] TradingView Lightweight Charts
- [ ] Live candlestick chart
- [ ] Zoom and pan
- [ ] Crosshair

## Sprint 3 Summary of finished

- ✅ Axios client
- ✅ API layer
- ✅ Service layer
- ✅ Dashboard layout
- ✅ Sidebar
- ✅ Navbar
- ✅ Market selector
- ✅ Timeframe selector
- ✅ Candle limit selector
- ✅ Load Market button
- ✅ React state management
- ✅ Backend integration
- ✅ TradingView Lightweight Charts integration
- ✅ Candlestick rendering
- ✅ Binance timestamp conversion
- ✅ Dynamic chart updates

## Phase 4

### Sprint 4.1

- ✅ SMC module
- ✅ Swing detector
- ✅ SMC controller
- ✅ Swing API endpoint

### Sprint 4.3

- ✅ BOS detector
- ✅ Bullish BOS
- ✅ Bearish BOS

## Sprint 4.5

### Liquidity Engine

- ✅ Created SMCConfig
- ✅ Refactored SwingDetector to SMCConfig
- ✅ Implemented Equal High detection
- ✅ Implemented Equal Low detection
- ✅ Returned average liquidity price

  Phase 2

- Swing Detection
- BOS Detection
- CHoCH Detection
- Liquidity Detection
- Order Blocks
- Fair Value Gaps

Phase 3

- Strategy Engine
- Signal Engine
- Backtesting Engine

Phase 4

- TradingView drawing tools
- Reports
- Statistics

## Current implementation matrix — Stage 01 audit, 2026-09-18

| Area | Actual state | Remaining work |
| --- | --- | --- |
| Express and React/Vite foundation | Implemented; both processes start, frontend serves HTML/modules and proxy works. | Browser visual/interaction checks and deployment verification. |
| Market data | Binance crypto candles load; exact BTCUSDT/1h/100 request passes. | FX/OANDA, historical pagination, gap/open-candle policy, retry/rate-limit behavior. |
| Candle normalization | Numeric OHLCV, timestamp/order and row validation implemented and tested. | Confirm closed-candle availability rules and day/session coverage expectations. |
| Chart/dashboard | v5 candlestick chart, selectors, table, statistics and inline retry path implemented; SSR/build checks pass. | Real-browser canvas, resize, retry and stale-request tests; SMC overlays are absent. |
| Swings and structure | Three-candle swings and previous-same-type HH/HL/LH/LL classification implemented. | Confirmation timing, ties and relevant/protected structural swings need approved rules. |
| BOS | Close-based breaks implemented; ordered results and reference compatibility tested. | Continuation versus reversal semantics and chronological availability validation. |
| CHoCH | Adjacent-label transition heuristic implemented; event fields work. | Meaningful reversal detection is not strategy-validated; ordinary alternating labels can suppress transitions. |
| Liquidity | Equal-high/low pairs and available-UTC-day extrema are wired into the API. | Full/partial-day policy, session/week levels, sweep detection and clustering rules. |
| Strategy and backtesting | OB/FVG/POI, HTF/LTF entries, risk/trade management and performance simulation are not implemented. | Future approved stages only. |
| Tests | 22 backend and four frontend checks pass; frontend lint/build pass. | Browser tests, chronological/repainting fixtures, time boundaries, actual timeout behavior and broader failure contracts. |
| Repository/security | Real root ignore file exists; environment examples exist; current docs omit old credential values. | Stage 01 removes local server environment from the root index before commit; tracked vendor files, nested Git ownership, historical credential rotation and production controls remain. |

**Corrections to earlier status claims:** SwingDetector does not use smcConfig; it still uses a fixed three-candle comparison. Equal-level output contains `{ first, second }` pairs, not an average liquidity price. Previous-day liquidity is already implemented and wired after pre-stage repairs, but its available-date behavior is not proof of complete trading-day data. Database/model files and backtesting files remain empty placeholders.

**Recommended next implementation step:** After approval of the next stage's actual scope, define candle availability (including open candles), swing confirmation time and trading-day boundaries, then add deterministic chronological fixtures before extending BOS/CHoCH behavior. Do not add OB/FVG/entry rules or the postponed standard event model during this audit.

Stage 02 remains pending user approval. Full findings and the append-only change record are in [Baseline.md](Baseline.md); repeatable commands and manual browser checks are in [Development.md](Development.md).

## Stage 02 update — Market data foundation, 2026-09-18

| Area | Current result |
| --- | --- |
| Provider contract | Fixed Binance Spot kline endpoint, existing configurable symbol/interval/limit and 8,000 ms timeout verified. Shared defaults used by service. Non-array bodies rejected; genuine [] retained. |
| Cleaning | Numeric OHLCV and chronological validation retained. Missing/sparse rows now reject the dataset instead of producing null records. No sorting, dropping or synthetic candles. |
| API contract | Existing metadata/shape and 200/400/500 categories preserved. All caught MarketController failures now return one sanitized public message. |
| Route/validation | Existing middleware ordering, 15-interval allowlist, configurable uppercase alphanumeric symbols and numeric limits 1–1000 verified without changes. |
| Tests | 42 backend tests pass, including 20 added market-data checks. Four existing frontend tests pass; lint/build pass. Root/server commands count the same backend tests. |
| Market-data limitations | No open-candle exclusion, gap/day/session policy, pagination, retry/backoff or richer upstream error statuses. Numeric conversion still uses JavaScript Number. |
| Other engine work | SMC logic, entry validation, OB/FVG/POI, backtesting, risk/statistics and the postponed event model remain outside this stage. |

The actual request/error contract is documented in API.md, and the data flow in Architecture.md. Baseline.md preserves the findings and repair evidence. Stage 02 is awaiting audit and explicit commit/push approval. Stage 03 must not begin automatically.

## Stage 03 update — Market structure engine, 2026-09-19

Stage 03 implements deterministic three-candle swings with an explicit confirmation index, same-type HH/LH/HL/LL classification, close-based BOS in an established trend, and protected-swing CHoCH. The strategy tests cover bullish and bearish structures, reversal/CHoCH, bullish and bearish BOS, empty/insufficient input, equal/ambiguous candles, indexes, source-candle references, confirmation availability, and chronological ordering. No Stage 04 work is included.
