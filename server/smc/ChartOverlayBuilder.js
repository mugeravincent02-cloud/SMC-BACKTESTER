function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTimestampSeconds(value) {
  const parsed = safeNumber(value);
  if (parsed === null) return null;
  const magnitude = Math.abs(parsed);
  return Math.floor(magnitude >= 1e11 ? parsed / 1000 : parsed);
}

function makeId(prefix, ...parts) {
  const clean = parts
    .filter((part) => part !== undefined && part !== null && part !== "")
    .map(String);
  return [prefix, ...clean].join("-");
}

function secondsFromMs(value) {
  return normalizeTimestampSeconds(value);
}

function buildChartOverlays(zones) {
  if (!Array.isArray(zones)) {
    return [];
  }

  return zones.filter(Boolean).map((zone) => {
    const direction = zone.direction || "NEUTRAL";
    const hasRange = Number.isFinite(zone.low) && Number.isFinite(zone.high);

    if (zone.type === "FVG" || hasRange) {
      return {
        id: zone.id ?? zone.index ?? `${direction}-${zone.type ?? "zone"}`,
        direction,
        type: "box",
        start: zone.low ?? zone.startPrice ?? zone.level ?? 0,
        end: zone.high ?? zone.endPrice ?? zone.level ?? 0,
        low: zone.low,
        high: zone.high,
        index: zone.index,
        level: zone.level,
      };
    }

    return {
      id: zone.id ?? zone.index ?? `${direction}-${zone.type ?? "zone"}`,
      direction,
      type: "line",
      price: zone.level ?? zone.low ?? zone.high ?? 0,
      low: zone.low,
      high: zone.high,
      index: zone.index,
      level: zone.level,
    };
  });
}

function normalizeFvgOverlays(fvg = [], candles = []) {
  const lastTimestamp =
    Array.isArray(candles) && candles.length > 0
      ? secondsFromMs(candles[candles.length - 1].time)
      : null;
  return (Array.isArray(fvg) ? fvg : [])
    .filter(
      (item) =>
        item && (item.startPrice !== undefined || item.endPrice !== undefined),
    )
    .map((item) => {
      const startPrice = safeNumber(item.startPrice);
      const endPrice = safeNumber(item.endPrice);
      if (startPrice === null || endPrice === null) return null;

      const low = Math.min(startPrice, endPrice);
      const high = Math.max(startPrice, endPrice);
      const startIndex = Number(item.startIndex ?? item.index ?? 0);
      const endIndex = Number(item.endIndex ?? item.index ?? startIndex);
      const startTime =
        Array.isArray(candles) && candles[startIndex]
          ? secondsFromMs(candles[startIndex].time)
          : null;
      const confirmationTime =
        Array.isArray(candles) && candles[endIndex]
          ? secondsFromMs(candles[endIndex].time)
          : null;

      if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex))
        return null;
      if (low >= high) return null;

      return {
        id:
          item.id ??
          makeId("fvg", item.direction || "NEUTRAL", startIndex, endIndex),
        kind: "FVG",
        direction: item.direction === "BEARISH" ? "BEARISH" : "BULLISH",
        startIndex,
        endIndex,
        startTime,
        // The detected pair confirms the FVG, but an active zone extends to
        // the right edge until the API supplies an explicit end time.
        endTime: secondsFromMs(item.endTime) ?? lastTimestamp ?? startTime,
        sourceIndex: startIndex,
        confirmationIndex: endIndex,
        confirmationTime: confirmationTime ?? startTime,
        firstAvailableTime: confirmationTime ?? startTime,
        low,
        high,
        mitigated: Boolean(item.mitigated),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));
}

function normalizeBreakOverlays(events = [], candles = [], kind = "BOS") {
  return (Array.isArray(events) ? events : [])
    .map((event) => {
      const direction = event.direction === "BEARISH" ? "BEARISH" : "BULLISH";
      const breakIndex = Number(event.breakIndex ?? event.index ?? 0);
      const brokenIndex = Number(
        event.brokenSwing ?? event.brokenStructure ?? event.index ?? 0,
      );
      const breakLabel = candles[breakIndex];
      const brokenLabel = candles[brokenIndex];
      if (!breakLabel) return null;

      const level = safeNumber(
        event.level ??
          (direction === "BULLISH"
            ? (brokenLabel?.high ?? event.breakPrice)
            : (brokenLabel?.low ?? event.breakPrice)),
      );
      const breakPrice = safeNumber(
        event.breakPrice ?? breakLabel.close ?? event.level,
      );
      if (level === null || breakPrice === null) return null;

      const startTime = secondsFromMs(
        brokenLabel?.time ?? breakLabel?.time ?? candles[0]?.time ?? 0,
      );
      const time = secondsFromMs(breakLabel.time);
      return {
        id:
          event.id ??
          makeId(kind.toLowerCase(), direction, breakIndex, brokenIndex),
        kind,
        direction,
        brokenIndex,
        breakIndex,
        startTime,
        time,
        sourceIndex: brokenIndex,
        confirmationIndex: breakIndex,
        confirmationTime: time,
        firstAvailableTime: time,
        level,
        breakPrice,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.breakIndex ?? 0) - (b.breakIndex ?? 0));
}

function normalizeLiquidityOverlays(liquidity = {}, candles = []) {
  const out = [];
  const lastTime =
    Array.isArray(candles) && candles.length > 0
      ? secondsFromMs(candles[candles.length - 1].time)
      : null;

  const push = (
    item,
    kind,
    direction = "NEUTRAL",
    level = null,
    low = null,
    high = null,
    extra = {},
  ) => {
    if (!item || !Number.isFinite(level ?? NaN)) return;
    const startTime = normalizeTimestampSeconds(
      item.startTime ?? item.time ?? candles[0]?.time,
    );
    const endTime = normalizeTimestampSeconds(
      item.endTime ?? lastTime ?? startTime ?? 0,
    );
    if (startTime === null || endTime === null) return;
    out.push({
      id: item.id ?? makeId("liquidity", kind, direction, String(level)),
      kind,
      direction,
      startTime,
      endTime,
      sourceIndex: Number.isFinite(item.sourceIndex)
        ? item.sourceIndex
        : undefined,
      confirmationIndex: Number.isFinite(item.confirmationIndex)
        ? item.confirmationIndex
        : undefined,
      firstAvailableTime: normalizeTimestampSeconds(
        item.firstAvailableTime ?? item.confirmationTime ?? item.time ?? startTime,
      ),
      level: Number(level),
      low: low === null ? undefined : Number(low),
      high: high === null ? undefined : Number(high),
      swept: Boolean(extra.swept ?? item.swept ?? false),
      reclaimed: Boolean(extra.reclaimed ?? item.reclaimed ?? false),
    });
  };

  const equalHighs = Array.isArray(liquidity.equalHighs)
    ? liquidity.equalHighs
    : [];
  const equalLows = Array.isArray(liquidity.equalLows)
    ? liquidity.equalLows
    : [];
  for (const entry of equalHighs) {
    const level = safeNumber(
      entry?.price ?? entry?.level ?? entry?.candle?.high,
    );
    if (level === null) continue;
    push(entry, "EQUAL_HIGH", "NEUTRAL", level, level, level);
  }
  for (const entry of equalLows) {
    const level = safeNumber(
      entry?.price ?? entry?.level ?? entry?.candle?.low,
    );
    if (level === null) continue;
    push(entry, "EQUAL_LOW", "NEUTRAL", level, level, level);
  }

  const swingHighs = Array.isArray(liquidity.swingLiquidity?.highs)
    ? liquidity.swingLiquidity.highs
    : [];
  const swingLows = Array.isArray(liquidity.swingLiquidity?.lows)
    ? liquidity.swingLiquidity.lows
    : [];
  for (const entry of swingHighs) {
    const level = safeNumber(
      entry?.price ?? entry?.candle?.high ?? entry?.level,
    );
    if (level === null) continue;
    push(entry, "SWING_HIGH", "BEARISH", level, level, level);
  }
  for (const entry of swingLows) {
    const level = safeNumber(
      entry?.price ?? entry?.candle?.low ?? entry?.level,
    );
    if (level === null) continue;
    push(entry, "SWING_LOW", "BULLISH", level, level, level);
  }

  for (const row of Array.isArray(liquidity.previousDayLiquidity)
    ? liquidity.previousDayLiquidity
    : []) {
    const level = safeNumber(row?.pdh ?? row?.pdl);
    const kind = row?.pdh != null ? "PDH" : "PDL";
    if (level === null) continue;
    push(
      {
        ...row,
        time: row.time ?? row.endTime ?? candles[candles.length - 1]?.time,
      },
      kind,
      "NEUTRAL",
      level,
      level,
      level,
    );
  }

  for (const row of Array.isArray(liquidity.previousWeekLiquidity)
    ? liquidity.previousWeekLiquidity
    : []) {
    const level = safeNumber(row?.pwh ?? row?.pwl);
    const kind = row?.pwh != null ? "PWH" : "PWL";
    if (level === null) continue;
    push(
      {
        ...row,
        time: row.time ?? row.endTime ?? candles[candles.length - 1]?.time,
      },
      kind,
      "NEUTRAL",
      level,
      level,
      level,
    );
  }

  for (const row of Array.isArray(liquidity.sessionLiquidity)
    ? liquidity.sessionLiquidity
    : []) {
    const level = safeNumber(row?.sessionHigh ?? row?.sessionLow);
    const kind = row?.sessionHigh != null ? "SESSION_HIGH" : "SESSION_LOW";
    if (level === null) continue;
    push(
      {
        ...row,
        time: row.time ?? row.endTime ?? candles[candles.length - 1]?.time,
      },
      kind,
      "NEUTRAL",
      level,
      level,
      level,
    );
  }

  for (const sweep of Array.isArray(liquidity.sweeps) ? liquidity.sweeps : []) {
    const direction = sweep.direction === "BULLISH" ? "BULLISH" : "BEARISH";
    const level = safeNumber(sweep.level ?? sweep.relevantPrice);
    if (level === null) continue;
    push(
      {
        id: sweep.id ?? makeId("sweep", direction, sweep.sweepCandleIndex ?? 0),
        startTime: sweep.sweepCandleTime ?? candles[0]?.time,
        endTime: sweep.confirmationTime ?? candles[candles.length - 1]?.time,
        time: sweep.sweepCandleTime ?? candles[0]?.time,
      },
      sweep.type || (direction === "BULLISH" ? "SSL" : "BSL"),
      direction,
      level,
      level,
      level,
      { swept: true, reclaimed: Boolean(sweep.reclaimed) },
    );
  }

  return out
    .filter((entry) => Number.isFinite(entry.level))
    .filter(
      (entry, index, array) =>
        array.findIndex((other) => other.id === entry.id) === index,
    )
    .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
}

function normalizeZoneOverlays(items = [], candles = [], kind = "ORDER_BLOCK") {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const direction = item.direction === "BEARISH" ? "BEARISH" : "BULLISH";
      const low = safeNumber(item.zoneLow ?? item.low);
      const high = safeNumber(item.zoneHigh ?? item.high);
      if (low === null || high === null || low >= high) return null;
      const startIndex = Number(item.startIndex ?? item.index ?? 0);
      const startTime = secondsFromMs(
        candles[startIndex]?.time ?? candles[0]?.time ?? 0,
      );
      const endTime = secondsFromMs(
        candles[candles.length - 1]?.time ?? startTime ?? 0,
      );
      return {
        id: item.id ?? makeId(kind.toLowerCase(), direction, startIndex),
        kind,
        direction,
        startIndex,
        startTime,
        endTime,
        sourceIndex: startIndex,
        confirmationIndex: startIndex,
        firstAvailableTime: startTime,
        low,
        high,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));
}

function normalizePoiOverlays(items = [], candles = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const direction = item.direction === "BEARISH" ? "BEARISH" : "BULLISH";
      const level = safeNumber(item.level ?? item.price);
      const low = safeNumber(item.low);
      const high = safeNumber(item.high);
      if (level === null && (low === null || high === null || low >= high))
        return null;
      const startIndex = Number(item.startIndex ?? item.index ?? 0);
      const startTime = secondsFromMs(
        candles[startIndex]?.time ?? candles[0]?.time ?? 0,
      );
      const endTime = secondsFromMs(
        candles[candles.length - 1]?.time ?? startTime ?? 0,
      );
      const pointPadding = Math.max(Math.abs(level ?? 0) * 0.0001, 1e-8);
      const zoneLow = low ?? (level === null ? null : level - pointPadding);
      const zoneHigh = high ?? (level === null ? null : level + pointPadding);
      if (zoneLow === null || zoneHigh === null || zoneLow >= zoneHigh) return null;
      return {
        id: item.id ?? makeId("poi", direction, startIndex),
        kind: "POI",
        direction,
        startIndex,
        startTime,
        endTime,
        low: zoneLow,
        high: zoneHigh,
        sourceIndex: startIndex,
        confirmationIndex: startIndex,
        firstAvailableTime: startTime,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));
}

function normalizeSmcOverlays(payload = {}, candles = []) {
  const bos = normalizeBreakOverlays(payload.bos || [], candles, "BOS");
  const choch = normalizeBreakOverlays(payload.choch || [], candles, "CHOCH");
  return {
    fvg: normalizeFvgOverlays(payload.fvg || [], candles),
    bos,
    choch,
    liquidity: normalizeLiquidityOverlays(payload.liquidity || {}, candles),
    orderBlocks: normalizeZoneOverlays(
      payload.orderBlocks || [],
      candles,
      "ORDER_BLOCK",
    ),
    pois: normalizePoiOverlays(payload.pois || [], candles),
  };
}

module.exports = {
  buildChartOverlays,
  normalizeFvgOverlays,
  normalizeBreakOverlays,
  normalizeLiquidityOverlays,
  normalizeZoneOverlays,
  normalizePoiOverlays,
  normalizeSmcOverlays,
};
