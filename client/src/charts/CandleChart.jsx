import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { chartOptions } from "../config/chartConfig";
import { mapCandlesToChart } from "../utils/chartDataMapper";
import { mapSmcOverlays } from "../utils/smcOverlayMapper";
import { renderSvgOverlayLayer } from "./overlays/SvgOverlayLayer";

const defaults = { fvg: true, bos: true, choch: true, liquidity: true, orderBlocks: true, pois: true };
const empty = { fvg: [], bos: [], choch: [], liquidity: [], orderBlocks: [], pois: [] };

export default function CandleChart({ candles, overlays = empty }) {
  const host = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const svgRef = useRef(null);
  const renderRef = useRef(null);
  const [visible, setVisible] = useState(defaults);
  const [selected, setSelected] = useState(null);
  const mapped = useMemo(() => mapSmcOverlays(overlays, candles), [overlays, candles]);
  renderRef.current = () =>
    renderSvgOverlayLayer(
      svgRef.current,
      chartRef.current,
      seriesRef.current,
      visible,
      mapped,
      setSelected,
    );
  const draw = useCallback(() => renderRef.current?.(), []);

  useEffect(() => {
    if (!host.current) return undefined;
    const chart = createChart(host.current, {
      ...chartOptions,
      width: host.current.clientWidth,
      height: 500,
    });
    const series = chart.addSeries(CandlestickSeries, {});
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute(
      "style",
      "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none",
    );
    host.current.append(svg);
    chartRef.current = chart;
    seriesRef.current = series;
    svgRef.current = svg;
    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: host.current?.clientWidth || 0 });
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
  const stamp = (time) => time ? new Date(time * 1000).toLocaleString() : "—";
  return <div>
    <fieldset aria-label="SMC overlays" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
      <legend>SMC overlays</legend>{Object.keys(defaults).map((key) => <label key={key}><input type="checkbox" checked={visible[key]} onChange={() => setVisible((old) => ({ ...old, [key]: !old[key] }))} /> {key.replace(/([A-Z])/g, " $1").toUpperCase()}</label>)}
    </fieldset>
    <small aria-label="SMC legend">FVG gap · BOS break of structure · CHoCH reversal · dashed lines liquidity. Dashed zones are forming/unconfirmed.</small>
    {selected && <aside role="status" aria-label="SMC overlay verification" style={{ margin: "8px 0", fontSize: 12 }}>
      <strong>{selected.type || "SMC"} {selected.direction || ""}</strong> · source: {selected.sourceIndex ?? "—"} ({stamp(selected.startTime)}) · confirmation: {selected.confirmationIndex ?? "—"} ({stamp(selected.time)}) · available: {stamp(selected.firstAvailableTime)} · level: {selected.level ?? `${selected.low}–${selected.high}`} · {selected.confirmed === false ? "forming" : selected.mitigated ? "mitigated" : selected.swept ? "swept" : selected.reclaimed ? "reclaimed" : "confirmed"}
    </aside>}
    <div ref={host} style={{ position: "relative", width: "100%", height: 500 }} />
  </div>;
}
