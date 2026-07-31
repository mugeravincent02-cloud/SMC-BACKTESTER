/** 
 * Very useful.

Imagine we later need to:

Cache data.
Retry failed requests.
Merge Binance and OANDA data.
Filter candles.
Log API usage.

All of that belongs here.

The other React components won't change.
*/

import { fetchCandles } from "../api/MarketApi";

export async function getMarketData(symbol, interval, limit) {
  return await fetchCandles(symbol, interval, limit);
}
