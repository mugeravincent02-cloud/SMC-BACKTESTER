# System Architecture

# Frontend Architecture

# Backend Architecture

# Module Responsibilities

# Data Flow

# Communication Flow

# Database Design

# Design Principles

User

↓

React

↓

Express

↓

Strategy Engine

↓

Backtesting Engine

↓

MongoDB

# Phase 2 Architecture

    Browser
        │
        ▼
    GET /api/candles

        │
        ▼
    marketRoutes
        │
        ▼
    MarketController
        │
        ▼
    BinanceService
        │
        ▼
    Binance API
        │
        ▼
    Raw Data
        │
        ▼
    DataCleaner
        │
        ▼
    Clean Data
        │
        ▼
    JSON Response

# As of Phase 2

## Current Backend Architecture

Client (React)
│
▼
Express API
│
▼
Routes
│
▼
Validation Middleware
│
▼
Controllers
│
▼
Market Services
│
▼
Binance REST API

### Routes

Receive incoming requests and forward them to middleware and controllers.

### Middleware

Validates request parameters before they reach the business logic.

### Controllers

Coordinate requests, call services and prepare API responses.

### Services

Communicate with external APIs and provide market data.

### DataCleaner

Transforms raw Binance candles into the application's standard candle model.

# Front end Architecture

    React
    │
    ▼
    Pages
    │
    ▼
    Components
    │
    ▼
    Services
    │
    ▼
    API Layer
    │
    ▼
    Axios
    │
    ▼
    Express API

Pages: Coordinate page-level state and compose the dashboard.
Components: Reusable UI elements with a single responsibility.
Services: Contain frontend business logic and orchestrate API calls.
API Layer: Encapsulates HTTP requests.
Axios: Handles communication with the backend.

## Chart Layer

The chart layer is responsible only for market visualization.

It receives processed candle data and displays:

- Candlesticks
- Indicators
- Strategy annotations
- Trading signals

# Analysis Engine

Market Data
│
▼
SMC Engine
│
├── Swing Detector
├── Structure Detector
├── BOS Detector
├── CHoCH Detector
└── Future Strategy Modules

# SMC Engine

     ↓

     Events

     ↓

     Chart

     ↓

     Backtester

SMC Engine
│
├── SwingDetector
├── StructureDetector
├── BOSDetector
├── CHOCHDetector
├── LiquidityDetector
│ ├── Equal Highs
│ └── Equal Lows

## Stage 02 — Market-data boundary, 2026-09-18

Current request/response flow:

```text
GET /api/candles
  -> MarketRoutes
  -> ValidateMarketRequest (400 JSON on invalid input)
  -> req.marketQuery { symbol, interval, numeric limit }
  -> MarketController
  -> BinanceService -> fixed Binance HTTPS endpoint (8,000 ms timeout)
  <- raw provider array (including valid [])
  -> DataCleaner (validate every row; reject malformed or unordered input)
  -> MarketController -> existing success envelope / sanitized 500 envelope
```

Responsibilities remain separated:

- **Validation middleware:** Applies existing MarketConfig defaults and existing symbol/interval/limit rules before an outbound request. The route wiring was verified and did not need modification.
- **BinanceService:** Uses the shared defaults, fixed URL and unchanged timeout. Returns only an array; missing/non-array response bodies and request failures throw the fixed public market-data error. No credentials, configurable upstream destination, retry loop or record-cleaning logic was added.
- **DataCleaner:** Converts the first six raw values into `{ time, open, high, low, close, volume }`, checks numeric/OHLC/timestamp validity and strictly increasing order. It now visits sparse-array entries instead of allowing holes to serialize as null. Genuine empty arrays remain empty. It neither repairs nor partially accepts invalid datasets.
- **MarketController:** Coordinates validated input, provider access and cleaning. Success metadata and response keys remain unchanged. Any caught failure produces the same generic 500 response; raw dependency messages/stacks are not reflected to clients. The changed service/controller catch blocks also log generic messages rather than raw errors.

`SMCController` also consumes BinanceService/DataCleaner, so it benefits from their data-boundary validation. No SMC controller, detector, strategy rule or standard event model changed in Stage 02. Direct service callers are expected to supply validated parameters; HTTP requests obtain that validation from the middleware.

Tests now include the real route, middleware, controller, service and cleaner with only Axios replaced at the provider boundary. A separate stalled loopback server verifies the real Axios eight-second timeout; it is a test-only destination and does not change production configuration. Existing detector and frontend suites remain regression checks.

Still outside this stage: historical pagination, open-candle exclusion, gap/day/session policies, decimal-arithmetic changes, retries/backoff, rate-limit coordination, full production security, and the trading/backtesting engines. See API.md for the actual market-data contract and Baseline.md for the append-only audit.

## Stage 03 — Market-structure engine, 2026-09-19

```text
clean historical candles
  -> SwingDetector (strict three-candle swings, confirmation index)
  -> StructureDetector (HH/LH/HL/LL and established trend state)
  -> BOSDetector (latest confirmed continuation level)
  -> CHOCHDetector (protected opposing-swing break)
  -> SMCController response
```

The detectors retain candle references and only use swings at or before their confirmation index. BOS and CHoCH are separate event types; both use candle closes and are emitted in chronological order.

## SMC chart flow

The page requests candles and SMC structure together with one abort signal. Candles remain canonical; an index/time mismatch suppresses overlays. The mapper validates records, and the SVG layer positions prices via the candle series, not the chart price scale.
