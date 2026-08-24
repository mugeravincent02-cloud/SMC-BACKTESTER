function getDayKey(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
  
  function detectPreviousDayLiquidity(candles) {
    if (!Array.isArray(candles) || candles.length === 0) {
      return [];
    }
  
    const dailyData = {};
  
    // Build completed daily high and low values
    for (const candle of candles) {
      const day = getDayKey(candle.time);
  
      if (!dailyData[day]) {
        dailyData[day] = {
          high: candle.high,
          low: candle.low,
        };
      } else {
        dailyData[day].high = Math.max(
          dailyData[day].high,
          candle.high
        );
  
        dailyData[day].low = Math.min(
          dailyData[day].low,
          candle.low
        );
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
      const currentDay = getDayKey(candle.time);
  
      const previous = previousDayMap[currentDay];
  
      return {
        time: candle.time,
        pdh: previous ? previous.pdh : null,
        pdl: previous ? previous.pdl : null,
        previousDay: previous
          ? previous.previousDay
          : null,
      };
    });
  }
  
  module.exports = {
    detectPreviousDayLiquidity,
  };