import api from "./axios";

export async function fetchCandles(
  symbol = "BTCUSDT",
  interval = "1h",
  limit = 100,
  signal
) {
  const response = await api.get("/candles", {
    signal,
    params: {
      symbol,
      interval,
      limit,
    },
  });
  return response.data;
}
