import { useCallback, useEffect, useMemo, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { chartOptions } from "../config/chartConfig";
import { mapCandlesToChart } from "../utils/chartDataMapper";
import { mapSmcOverlays } from "../utils/smcOverlayMapper";
import { renderSvgOverlayLayer } from "./overlays/SvgOverlayLayer";

const defaultVisible = {
  fvg: true,
  bos: true,
  choch: true,
  liquidity: true,
  orderBlocks: true,
  pois: true,
};
const empty = { fvg: [], bos: [], choch: [], liquidity: [], orderBlocks: [], pois: [] };
const noop = () => {};

export default function CandleChart({
  candles,
  overlays = empty,
  visible = defaultVisible,
  onSelectOverlay = noop,
}) {
  const host = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const svgRef = useRef(null);
  const renderRef = useRef(null);
  const mapped = useMemo(() => mapSmcOverlays(overlays, candles), [overlays, candles]);
  renderRef.current = () =>
    renderSvgOverlayLayer(
      svgRef.current,
      chartRef.current,
      seriesRef.current,
      visible,
      mapped,
      onSelectOverlay,
    );
  const draw = useCallback(() => renderRef.current?.(), []);

  useEffect(() => {
    if (!host.current) return undefined;
    const size = () => ({
      width: host.current?.clientWidth || 0,
      height: host.current?.clientHeight || 500,
    });
    const chart = createChart(host.current, {
      ...chartOptions,
      ...size(),
    });
    const series = chart.addSeries(CandlestickSeries, {});
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute(
      "style",
      "position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none",
    );
    host.current.append(svg);
    chartRef.current = chart;
    seriesRef.current = series;
    svgRef.current = svg;
    const observer = new ResizeObserver(() => {
      chart.applyOptions(size());
      draw();
    });
    observer.observe(host.current);
    chart.timeScale().subscribeVisibleTimeRangeChange(draw);
    chart.subscribeCrosshairMove(draw);
    return () => {
      observer.disconnect();
      chart.timeScale().unsubscribeVisibleTimeRangeChange(draw);
      chart.unsubscribeCrosshairMove(draw);
      chart.remove();
      chartRef.current = null;
    };
  }, [draw]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(mapCandlesToChart(candles || []));
    chartRef.current.timeScale().fitContent();
    draw();
  }, [candles, draw]);

  useEffect(() => {
    draw();
  }, [draw, mapped, visible]);
  return <div ref={host} className="chart-host" />;
}
