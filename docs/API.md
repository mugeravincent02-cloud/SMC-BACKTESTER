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

## Stage 02 — Market-data contract, 2026-09-18

This section records the current `/api/candles` contract and supersedes historical error-handling descriptions above. No response fields or HTTP status categories were added in this stage.

### Request and provider mapping

`GET /api/candles?symbol=BTCUSDT&interval=1h&limit=100`

- Defaults remain BTCUSDT, 1h and 100. Symbols remain configurable uppercase ASCII letters/digits; lowercase, separators, whitespace and repeated values are rejected, not normalized. Format validation does not establish whether a symbol is listed on Binance.
- Existing allowed intervals remain `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M`, case-sensitive. The application does not enable `1s` in this stage.
- Limits remain scalar values normalized with JavaScript `Number`, then required to be integers in 1–1000. Existing accepted forms such as `0010`, `100.0`, `1e2`, `0x64` and whitespace-padded numeric text still normalize to integers. Empty text, nonnumeric values, fractions outside integer conversion, infinity, out-of-range and repeated values are rejected.
- Validation precedes provider access. Binance receives the symbol, interval and numeric limit as query parameters at the fixed HTTPS URL `https://api.binance.com/api/v3/klines`, with the unchanged **8,000 ms timeout**. No credentials, caller-controlled URL, retries or additional provider parameters are introduced.

The URL, parameters and raw candle layout were checked against the [official Binance Spot REST specification](https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md#klinecandlestick-data). The application retains its existing defaults and interval subset rather than automatically adopting every provider option.

### Success — HTTP 200

Illustrative response to a one-candle request:

```json
{
  "success": true,
  "timestamp": "2026-09-18T00:00:00.000Z",
  "symbol": "BTCUSDT",
  "interval": "1h",
  "total": 1,
  "data": [
    { "time": 1767225600000, "open": 10, "high": 12, "low": 8, "close": 11, "volume": 20 }
  ]
}
```

`timestamp` is response-generation time in ISO format. Candle `time` is the numeric opening timestamp in milliseconds. `total` equals the number of returned cleaned rows, not necessarily the requested limit. A genuine provider `[]` remains HTTP 200 with `success: true`, `total: 0`, `data: []` and the normal metadata. An empty/missing HTTP body, object or string is not an empty candle array and is rejected.

The cleaner reads the first six raw fields, converts them to numbers and ignores unused provider columns. Existing validation requires a valid nonnegative integer timestamp, finite positive OHLC values with consistent bounds, and finite nonnegative volume. Required fields cannot be missing, blank, boolean or structured values. Timestamps must increase strictly. Invalid/missing rows, including sparse in-memory arrays, fail the entire request: nothing is sorted, deduplicated, silently dropped or synthesized. Current/open-candle and gap policies remain unchanged.

### Errors

All errors caught by this route's validation/controller use the existing `{ "success": false, "message": "..." }` envelope:

| Status | Condition | Exact message |
| --- | --- | --- |
| 400 | Invalid or repeated symbol | `Invalid symbol format` |
| 400 | Invalid or repeated interval | `Invalid interval` |
| 400 | Invalid or repeated limit | `Limit must be an integer between 1 and 1000.` |
| 500 | Network/provider rejection, timeout, malformed response/candles/order, or an unexpected controller dependency failure | `Unavailable to fetch market data.` |

The 500 message is now fixed for every caught MarketController failure; raw exception messages, provider bodies, upstream status details and stacks are not returned. A syntactically valid but unlisted symbol reaches Binance and currently produces this generic 500 response, not a local 400. Provider 400/429/5xx and timeout failures also retain HTTP 500 for compatibility; no new error classification or schema is introduced. Express errors before this route's handler and errors from unrelated routes are outside this contract.

Contract coverage includes full pipeline tests that stub only Axios. Live checks verified BTCUSDT/1h/100, ETHUSDT/5m/2, invalid parameter cases and an unlisted symbol. Empty/malformed data and transport failures use deterministic test fixtures; an actual Axios timeout was verified against a stalled local HTTP server.
