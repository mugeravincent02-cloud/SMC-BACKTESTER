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
