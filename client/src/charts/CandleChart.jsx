import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { chartOptions } from "../config/chartConfig";
import { mapCandlesToChart } from "../utils/chartDataMapper";

export default function CandleChart({ candles }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!candles || candles.length === 0) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {});

    candleSeries.setData(mapCandlesToChart(candles));

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "500px" }} />
  );
}
