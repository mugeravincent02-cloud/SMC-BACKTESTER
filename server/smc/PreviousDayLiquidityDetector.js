function parseTimeString(value) {
  if (!value || typeof value !== "string") {
    return 0;
  }

  const match = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(value);
  if (!match) {
    return 0;
  }

  const [, hours, minutes, seconds = "0"] = match;
  return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
}

function getLocalDateParts(timestamp, timeZone = "UTC") {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const values = {};
  for (const part of formatter.formatToParts(new Date(timestamp))) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
    second: Number(values.second || 0),
  };
}

function getDayKey(timestamp, timeZone = "UTC") {
  const parts = getLocalDateParts(timestamp, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function getWeekKey(timestamp, timeZone = "UTC") {
  const parts = getLocalDateParts(timestamp, timeZone);
  const localDate = Date.UTC(parts.year, parts.month - 1, parts.day);
  const dayIndex = new Date(localDate).getUTCDay();
  const mondayOffset = (dayIndex + 6) % 7;
  const monday = new Date(localDate - mondayOffset * 24 * 60 * 60 * 1000);

  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
}

function getSessionKey(timestamp, sessionConfig = {}) {
  const timezone = sessionConfig.timezone || "UTC";
  const sessionStart = sessionConfig.sessionStart || "00:00";
  const sessionEnd = sessionConfig.sessionEnd || "23:59:59";
  const parts = getLocalDateParts(timestamp, timezone);
  const minuteOfDay = parts.hour * 60 * 60 + parts.minute * 60 + parts.second;
  const startSeconds = parseTimeString(sessionStart);
  const endSeconds = parseTimeString(sessionEnd);
  const isCrossMidnight = startSeconds > endSeconds;
  const inSession = isCrossMidnight
    ? minuteOfDay >= startSeconds || minuteOfDay <= endSeconds
    : minuteOfDay >= startSeconds && minuteOfDay <= endSeconds;

  const dayKey = getDayKey(timestamp, timezone);
  return inSession ? dayKey : `${dayKey}:outside`;
}

function detectPreviousDayLiquidity(candles, config = {}) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  const timezone = config.timezone || config.sessionConfig?.timezone || "UTC";
  const dailyData = {};

  for (const candle of candles) {
    const day = getDayKey(candle.time, timezone);

    if (!dailyData[day]) {
      dailyData[day] = { high: candle.high, low: candle.low };
    } else {
      dailyData[day].high = Math.max(dailyData[day].high, candle.high);
      dailyData[day].low = Math.min(dailyData[day].low, candle.low);
    }
  }

  const days = Object.keys(dailyData).sort();
  const previousDayMap = {};

  for (let i = 1; i < days.length; i++) {
    const currentDay = days[i];
    const previousDay = days[i - 1];
    previousDayMap[currentDay] = {
      pdh: dailyData[previousDay].high,
      pdl: dailyData[previousDay].low,
      previousDay,
    };
  }

  return candles.map((candle) => {
    const currentDay = getDayKey(candle.time, timezone);
    const previous = previousDayMap[currentDay];

    return {
      time: candle.time,
      pdh: previous ? previous.pdh : null,
      pdl: previous ? previous.pdl : null,
      previousDay: previous ? previous.previousDay : null,
    };
  });
}

function detectPreviousWeekLiquidity(candles, config = {}) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  const timezone = config.timezone || config.sessionConfig?.timezone || "UTC";
  const weeklyData = {};

  for (const candle of candles) {
    const week = getWeekKey(candle.time, timezone);

    if (!weeklyData[week]) {
      weeklyData[week] = { high: candle.high, low: candle.low };
    } else {
      weeklyData[week].high = Math.max(weeklyData[week].high, candle.high);
      weeklyData[week].low = Math.min(weeklyData[week].low, candle.low);
    }
  }

  const weeks = Object.keys(weeklyData).sort();
  const previousWeekMap = {};

  for (let i = 1; i < weeks.length; i++) {
    const currentWeek = weeks[i];
    const previousWeek = weeks[i - 1];
    previousWeekMap[currentWeek] = {
      pwh: weeklyData[previousWeek].high,
      pwl: weeklyData[previousWeek].low,
      previousWeek,
    };
  }

  return candles.map((candle) => {
    const currentWeek = getWeekKey(candle.time, timezone);
    const previous = previousWeekMap[currentWeek];

    return {
      time: candle.time,
      pwh: previous ? previous.pwh : null,
      pwl: previous ? previous.pwl : null,
      previousWeek: previous ? previous.previousWeek : null,
    };
  });
}

function detectSessionLiquidity(candles, config = {}) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  const sessionConfig = { ...(config.sessionConfig || {}), ...(config || {}) };
  const timezone = sessionConfig.timezone || "UTC";
  const sessionMap = {};

  return candles.map((candle) => {
    const key = getSessionKey(candle.time, sessionConfig);
    if (!sessionMap[key]) {
      sessionMap[key] = { high: candle.high, low: candle.low };
    } else {
      sessionMap[key].high = Math.max(sessionMap[key].high, candle.high);
      sessionMap[key].low = Math.min(sessionMap[key].low, candle.low);
    }

    return {
      time: candle.time,
      sessionHigh: sessionMap[key].high,
      sessionLow: sessionMap[key].low,
    };
  });
}

module.exports = {
  detectPreviousDayLiquidity,
  detectPreviousWeekLiquidity,
  detectSessionLiquidity,
  getDayKey,
  getWeekKey,
  getSessionKey,
};
