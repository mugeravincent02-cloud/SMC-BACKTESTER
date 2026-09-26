const NS = "http://www.w3.org/2000/svg";
const colors = { BULLISH: ["rgba(16,185,129,.20)", "#34d399"], BEARISH: ["rgba(239,68,68,.20)", "#f87171"] };

export function renderSvgOverlayLayer(svg, chart, candleSeries, visible, overlays, onSelect) {
  if (!svg || !chart || !candleSeries) return;
  svg.replaceChildren();
  const x = (time) => chart.timeScale().timeToCoordinate(time);
  const y = (value) => candleSeries.priceToCoordinate(value);
  const add = (tag, attrs, item) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    node.style.pointerEvents = "all";
    node.style.cursor = "pointer";
    node.addEventListener("click", () => onSelect?.(item));
    svg.append(node);
  };
  const rect = (item, muted = false) => {
    const [fill, stroke] = colors[item.direction] || ["rgba(96,165,250,.10)", "#60a5fa"];
    const x1 = x(item.startTime), x2 = x(item.endTime), y1 = y(item.low), y2 = y(item.high);
    if ([x1, x2, y1, y2].every(Number.isFinite)) add("rect", { x: Math.min(x1,x2), y: Math.min(y1,y2), width: Math.max(2,Math.abs(x2-x1)), height: Math.max(2,Math.abs(y2-y1)), fill: muted ? fill.replace(".20", ".10") : fill, stroke, "stroke-width": 1, "stroke-dasharray": item.confirmed === false ? "4 3" : "" }, item);
  };
  const line = (item, stroke, dash = "") => {
    const x1 = x(item.startTime), x2 = x(item.endTime), yy = y(item.level);
    if ([x1,x2,yy].every(Number.isFinite)) add("line", { x1, x2, y1: yy, y2: yy, stroke, "stroke-width": 1.5, "stroke-dasharray": dash }, item);
  };
  const breakMarker = (item, color, label) => {
    const xx = x(item.time), yy = y(item.level);
    if (![xx, yy].every(Number.isFinite)) return;
    add("circle", { cx: xx, cy: yy, r: 4, fill: color, stroke: "#fff", "stroke-width": 1 }, item);
    add("text", { x: xx + 6, y: yy - 6, fill: color, "font-size": 11, "font-weight": 700 }, item);
    svg.lastChild.textContent = label;
  };
  if (visible.fvg) overlays.fvg.forEach((item) => rect(item));
  if (visible.orderBlocks) overlays.orderBlocks.forEach((item) => rect(item, true));
  if (visible.pois) overlays.pois.forEach((item) => rect(item, true));
  if (visible.liquidity) overlays.liquidity.forEach((item) => line(item, "#fbbf24", "4 4"));
  if (visible.bos) overlays.bos.forEach((item) => {
    const color = item.direction === "BULLISH" ? "#22c55e" : "#ef4444";
    line(item, color);
    breakMarker(item, color, "BOS");
  });
  if (visible.choch) overlays.choch.forEach((item) => {
    const color = item.direction === "BULLISH" ? "#60a5fa" : "#f97316";
    line(item, color);
    breakMarker(item, color, "CHoCH");
  });
}
