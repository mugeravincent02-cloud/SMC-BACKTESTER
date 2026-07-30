import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

export default function CandleChart({ candles }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!candles || candles.length === 0) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {});

    const chartData = candles.map((candle) => ({
      time: candle.time / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candleSeries.setData(chartData);

    return () => {
      chart.remove();
    };
  }, [candles]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "500px" }} />
  );
}
