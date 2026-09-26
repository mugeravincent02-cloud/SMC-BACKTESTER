const FAMILIES = ["fvg", "bos", "choch", "liquidity", "orderBlocks", "pois"];
const seconds = (value) => { const number = Number(value); return Number.isFinite(number) ? Math.floor(Math.abs(number) >= 1e11 ? number / 1000 : number) : null; };
const price = (value) => { const number = Number(value); return Number.isFinite(number) ? number : null; };

/** Converts the API contract into a validated, chart-only overlay model. */
export function mapSmcOverlays(overlays, candles) {
  const result = Object.fromEntries(FAMILIES.map((family) => [family, []]));
  const times = (candles || []).map((candle) => seconds(candle?.time)).filter((time) => time !== null);
  const firstTime = times[0];
  const lastTime = times.at(-1);
  if (!overlays || !lastTime) return result;
  const clampTime = (value, fallback = lastTime) => {
    const parsed = seconds(value);
    if (parsed === null) return fallback;
    return Math.min(Math.max(parsed, firstTime), lastTime);
  };
  for (const family of FAMILIES) {
    const ids = new Set();
    for (const raw of Array.isArray(overlays[family]) ? overlays[family] : []) {
      if (!raw || typeof raw !== "object" || raw.id == null || raw.id === "" || ids.has(raw.id)) continue;
      const sourceIndex = Number(raw.sourceIndex ?? raw.startIndex ?? raw.index);
      const confirmationIndex = Number(raw.confirmationIndex ?? raw.breakIndex ?? raw.endIndex ?? raw.index);
      if ((Number.isFinite(sourceIndex) && (sourceIndex < 0 || sourceIndex >= times.length)) || (Number.isFinite(confirmationIndex) && (confirmationIndex < 0 || confirmationIndex >= times.length))) continue;
      const startTime = clampTime(raw.startTime ?? raw.time ?? times[sourceIndex], firstTime);
      const endTime = clampTime(raw.endTime ?? raw.time ?? lastTime, lastTime);
      const eventTime = clampTime(raw.time ?? times[confirmationIndex] ?? startTime, startTime);
      const firstAvailableTime = Math.max(
        startTime,
        clampTime(
          raw.firstAvailableTime ?? raw.confirmationTime ?? times[confirmationIndex] ?? eventTime,
          eventTime,
        ),
      );
      if (endTime < startTime) continue;
      const item = { ...raw, id: String(raw.id), startTime, endTime, time: eventTime, firstAvailableTime, sourceIndex: Number.isFinite(sourceIndex) ? sourceIndex : undefined, confirmationIndex: Number.isFinite(confirmationIndex) ? confirmationIndex : undefined };
      if (["fvg", "orderBlocks", "pois"].includes(family)) {
        item.low = price(raw.low ?? raw.startPrice); item.high = price(raw.high ?? raw.endPrice);
        if (item.low === null || item.high === null || item.low >= item.high) continue;
      } else {
        item.level = price(raw.level ?? raw.breakPrice ?? raw.low ?? raw.high);
        if (item.level === null) continue;
      }
      ids.add(raw.id); result[family].push(item);
    }
    result[family].sort((a, b) => a.startTime - b.startTime || (a.level ?? a.low) - (b.level ?? b.low));
  }
  return result;
}
