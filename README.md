# Smart Money Backtester

A full-stack Smart Money Concept (SMC) market-analysis and backtesting project built with React, Express, and Node.js.

## Current status

This project is beyond the planning stage. The codebase includes working market-data validation, SMC detection modules, backtesting and trade analysis utilities, and production-facing API safeguards.

The repository is currently in a verified implementation state for the completed stage work.

## What is implemented

### Market data and API foundation

- Binance candle fetching and validation
- Candle cleaning and normalization for OHLCV data
- Input validation and error handling for market requests
- Existing API routes for market and SMC data

### SMC engine

- Swing detection
- Structure classification
- BOS and CHoCH detection
- Liquidity detection
- Liquidity sweeps
- Order blocks
- Fair value gaps
- Points of interest
- HTF/LTF alignment checks
- Entry validation

### Backtesting and reporting

- Chronological trade execution flow
- Risk and position sizing logic
- Trade statistics and performance summaries
- Backtest runner for simulation and profit analysis
- Backtest API route

### Application safety and health checks

- Health endpoint for service status
- Security headers for responses
- Sanitized invalid backtest configuration handling

### Frontend

- React dashboard layout
- Market selector controls
- Candle chart rendering
- Statistics panel
- Candle table

## Verification

Fresh project validation was run with:

```bash
npm test -- --test-reporter=spec
```

Result:

- 68 tests passed
- 0 failed

## Repository structure

```text
client/
  src/
    api/
    charts/
    components/
    pages/
    services/
    utils/

server/
  app.js
  server.js
  backtesting/
  config/
  controllers/
  market/
  routes/
  smc/
  middleware/
  events/

tests/
  api/
  market/
  strategy/
  backtesting/

docs/
  Agile.md
  API.md
  Architecture.md
  Baseline.md
  Development.md
  Roadmap.md
  Strategy.md
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Run the test suite

```bash
npm test
```

### 3. Start the backend

```bash
npm start
```

## Main API routes

- GET /api/candles
- GET /api/smc/swings
- POST /api/backtest
- GET /health

## Development notes

This is still an iterative engineering project rather than a finished production trading platform. The implementation is organized around stage-based delivery and continues to evolve with SMC logic, backtesting behavior, and production hardening work.

## Author

Mugera Vincent

## License

ISC
