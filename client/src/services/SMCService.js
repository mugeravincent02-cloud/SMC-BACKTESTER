import { fetchSmcStructure } from "../api/smcApi";

export async function getSmcData(symbol, interval, limit, signal) {
  return await fetchSmcStructure(symbol, interval, limit, signal);
}
