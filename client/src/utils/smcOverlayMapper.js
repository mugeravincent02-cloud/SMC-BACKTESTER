const FAMILIES = ["fvg", "bos", "choch", "liquidity", "orderBlocks", "pois"];

const seconds = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.floor(Math.abs(number) >= 1e11 ? number / 1000 : number)
    : null;
};

const price = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function mapSmcOverlays(overlays, candles) {
  const result = Object.fromEntries(FAMILIES.map((family) => [family, []]));
  const times = (candles || [])
    .map((candle) => seconds(candle?.time))
    .filter((time) => time !== null);

  const firstTime = times[0];
  const lastTime = times.at(-1);

  if (!overlays || !firstTime || !lastTime) return result;

  const clampTime = (value, fallback) => {
    const parsed = seconds(value);
    if (parsed === null) return fallback;
    return Math.min(Math.max(parsed, firstTime), lastTime);
  };

  for (const family of FAMILIES) {
    const ids = new Set();
    const list = Array.isArray(overlays[family]) ? overlays[family] : [];

    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;

      const id = String(raw.id ?? `${family}-${ids.size}`);
      if (ids.has(id)) continue;

      const sourceIndex = Number(
        raw.sourceIndex ?? raw.startIndex ?? raw.index,
      );
      const confirmationIndex = Number(
        raw.confirmationIndex ?? raw.breakIndex ?? raw.endIndex ?? raw.index,
      );

      const startTime = clampTime(
        raw.startTime ?? raw.time ?? times[sourceIndex] ?? firstTime,
        firstTime,
      );
      const endTime = clampTime(raw.endTime ?? lastTime, lastTime);
      const eventTime = clampTime(
        raw.time ?? times[confirmationIndex] ?? startTime,
        startTime,
      );
      const firstAvailableTime = clampTime(
        raw.firstAvailableTime ?? raw.confirmationTime ?? eventTime,
        eventTime,
      );

      if (endTime < startTime) continue;

      const item = {
        ...raw,
        id,
        startTime,
        endTime,
        time: eventTime,
        firstAvailableTime,
        sourceIndex: Number.isFinite(sourceIndex) ? sourceIndex : undefined,
        confirmationIndex: Number.isFinite(confirmationIndex)
          ? confirmationIndex
          : undefined,
      };

      if (["fvg", "orderBlocks", "pois"].includes(family)) {
        item.low = price(raw.low ?? raw.startPrice);
        item.high = price(raw.high ?? raw.endPrice);

        if (item.low === null || item.high === null || item.low >= item.high) {
          continue;
        }
      } else {
        item.level = price(raw.level ?? raw.breakPrice ?? raw.low ?? raw.high);

        if (item.level === null) continue;
      }

      ids.add(id);
      result[family].push(item);
    }

    result[family].sort(
      (a, b) =>
        a.startTime - b.startTime || (a.level ?? a.low) - (b.level ?? b.low),
    );
  }

  const bars = (candles || []).map((candle) => ({
    time: seconds(candle.time),
    low: Number(candle.low),
    high: Number(candle.high),
  }));

  for (const [family, items] of Object.entries(result)) {
    const isStructure = family === "bos" || family === "choch";
    const isZone = ["fvg", "orderBlocks", "pois"].includes(family);

    for (const item of items) {
      const index = item.confirmationIndex;
      const indexedTime =
        Number.isInteger(index) && index >= 0 ? bars[index]?.time : null;

      // Never mitigate on the candle that confirms the object.
      const confirmedAt = Math.max(
        indexedTime ?? 0,
        seconds(item.confirmationTime) ?? 0,
        seconds(item.firstAvailableTime) ?? 0,
        seconds(item.time) ?? 0,
        item.startTime,
      );

      const low = isZone ? item.low : item.level;
      const high = isZone ? item.high : item.level;

      if (![low, high, confirmedAt].every(Number.isFinite)) continue;

      const hitIndex = bars.findIndex(
        (bar) =>
          Number.isFinite(bar.time) &&
          Number.isFinite(bar.low) &&
          Number.isFinite(bar.high) &&
          bar.time > confirmedAt &&
          bar.low <= high &&
          bar.high >= low,
      );

      const touched = hitIndex !== -1;
      const contactTime = touched ? bars[hitIndex].time : null;

      item.endTime = contactTime ?? bars.at(-1)?.time ?? item.endTime;
      item.contactTime = contactTime;
      item.contactIndex = touched ? hitIndex : null;
      item.active = isStructure || !touched;

      if (!isStructure) {
        item.mitigated = touched;
        item.mitigationTime = contactTime;
        item.mitigationIndex = touched ? hitIndex : null;
      }
    }
  }
  return result;
}
