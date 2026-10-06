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
const empty = {
  fvg: [],
  bos: [],
  choch: [],
  liquidity: [],
  orderBlocks: [],
  pois: [],
};
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
  const mapped = useMemo(
    () => mapSmcOverlays(overlays, candles),
    [overlays, candles],
  );
  renderRef.current = () => {
    renderSvgOverlayLayer(
      svgRef.current,
      chartRef.current,
      seriesRef.current,
      visible,
      mapped,
      onSelectOverlay,
    );
  };

  const frame = useRef(0);
  const draw = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (chartRef.current) renderRef.current?.();
    });
  }, []);

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
    svg.style.zIndex = "10";

    host.current.append(svg);
    chartRef.current = chart;
    seriesRef.current = series;
    svgRef.current = svg;

    const observer = new ResizeObserver(() => {
      chart.applyOptions(size());
      draw();
    });
    observer.observe(host.current);

    const element = host.current;
    const timescale = chart.timeScale();
    const drag = (event) => {
      if (event.buttons) draw();
    };

    timescale.subscribeVisibleLogicalRangeChange(draw);
    element.addEventListener("pointermove", drag);
    element.addEventListener("wheel", draw, { passive: true });
    element.addEventListener("pointerup", draw);
    element.addEventListener("dblclick", draw);

    return () => {
      observer.disconnect();
      timescale.unsubscribeVisibleLogicalRangeChange(draw);
      element.removeEventListener("pointermove", drag);
      element.removeEventListener("wheel", draw);
      element.removeEventListener("pointerup", draw);
      element.removeEventListener("dblclick", draw);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      svg.remove();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      svgRef.current = null;
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
