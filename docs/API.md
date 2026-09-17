Authentication

Endpoints

Request

Response

Error Codes

Examples

# As of Phase 2

# GET /api/candles

Returns market candlestick data.

## Query Parameters

| Parameter | Default | Description       |
| --------- | ------- | ----------------- |
| symbol    | BTCUSDT | Trading pair      |
| interval  | 1h      | Candle timeframe  |
| limit     | 100     | Number of candles |

Example

GET

/api/candles?symbol=BTCUSDT&interval=1h&limit=100

# Expected Response

        {
    "success": true,
    "timestamp": "...",
    "symbol": "BTCUSDT",
    "interval": "1h",
    "total": 100,
    "data": [
        {
        "time": 1784952000000,
        "open": 64085.36,
        "high": 64205.67,
        "low": 64085.15,
        "close": 64181.46,
        "volume": 171.38
        }
    ]
    }

# If wrong data is requested, error response would be;

    {
        "success": false,
        "message": "Invalid interval."
    }

# OR

    {
        "success": false,
        "message": "Limit must be an integer between 1 and 1000."
    }

# As of stage 3

frontend now consumes:
GET /api/candles

## Pre-Stage 01 repair update — 2026-09-18

Both `GET /api/candles` and `GET /api/smc/swings` accept the same validated query parameters:

| Parameter | Default | Accepted values |
| --- | --- | --- |
| symbol | BTCUSDT | One uppercase alphanumeric symbol; availability is determined by Binance. |
| interval | 1h | 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M. |
| limit | 100 | One integer from 1 through 1000. |

Invalid parameters return HTTP 400 JSON with `success: false` and a `message`. Duplicate parameter values are rejected. Controllers receive normalized parameters through `req.marketQuery`; they no longer attempt to mutate Express 5's query getter.

Example SMC request:

```text
GET /api/smc/swings?symbol=ETHUSDT&interval=5m&limit=100
```

The response preserves the existing top-level fields `success`, `swings`, `structure`, `bos`, `choch`, and `liquidity`. Liquidity contains `equalHighs`, `equalLows`, and `previousDayLiquidity`. Each previous-day row has `time`, `pdh`, `pdl`, and `previousDay`; rows in the first available UTC date have null previous-day values. These are extrema from available candles, not a guarantee of full-day coverage.

BOS events are ordered by `breakIndex`. Both directions expose `brokenSwing`; bullish events retain the older `brokenSwings` alias for compatibility. This is a local response repair, not adoption of a standard event model.

Market timestamps remain milliseconds; the chart mapper converts them to seconds. Invalid candle rows and non-increasing timestamps now fail with HTTP 500 JSON instead of forwarding invalid numbers to charts. Binance requests have an 8-second timeout; upstream failures retain the existing generic market-data error response.

The frontend defaults to same-origin `/api`. Vite dev/preview proxies to `http://127.0.0.1:5000`; set `API_PROXY_TARGET` in `client/.env` for another local backend. For deployed frontend assets, provide a same-origin reverse proxy or set the public `VITE_API_BASE_URL` at build time. Never put secrets in `VITE_` variables.

The detailed append-only repair record and validation evidence are in `docs/Baseline.md`.
