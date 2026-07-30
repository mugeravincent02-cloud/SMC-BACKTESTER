import api from "./axios";

export async function fetchCandles(
  symbol = "BTCUSDT",
  interval = "1h",
  limit = 1000
) {
  const response = await api.get("/candles", {
    params: {
      symbol,
      interval,
      limit,
    },
  });
  return response.data;
}
