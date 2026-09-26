import api from "./axios";

export async function fetchSmcStructure(
  symbol = "BTCUSDT",
  interval = "1h",
  limit = 100,
  signal,
) {
  const response = await api.get("/smc/swings", {
    signal,
    params: {
      symbol,
      interval,
      limit,
    },
  });
  return response.data;
}
