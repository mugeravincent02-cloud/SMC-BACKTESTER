import { after, before, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let vite;

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
});

after(async () => { await vite?.close(); });

it("renders visible timeframe labels and the selected timeframe", async () => {
  const { default: Selector } = await vite.ssrLoadModule("/src/components/market/TimeframeSelector.jsx");
  const html = renderToStaticMarkup(createElement(Selector, { interval: "1h", onChange() {} }));
  const options = [...html.matchAll(/<option value="([^"]+)"[^>]*>([^<]*)<\/option>/g)];
  assert.equal(options.length, 11);
  for (const [, value, label] of options) assert.equal(label, value);
  assert.match(html, /<option value="1h" selected="">1h<\/option>/);
});

it("uses the same candle limit range as the backend", async () => {
  const { default: Selector } = await vite.ssrLoadModule("/src/components/market/LimitSelector.jsx");
  const html = renderToStaticMarkup(createElement(Selector, { limit: 100, onChange() {} }));
  assert.match(html, /min="1"/);
  assert.match(html, /max="1000"/);
  assert.match(html, /step="1"/);
});

it("renders the full-screen chart workspace with navbar dropdown controls", async () => {
  const { default: Home } = await vite.ssrLoadModule("/src/pages/Home.jsx");
  const html = renderToStaticMarkup(createElement(Home));
  for (const className of ["dashboard-layout", "navbar", "navbar-controls", "sidebar", "chart", "chart-host"]) {
    assert.ok(html.includes(`class="${className}"`));
  }
  assert.match(html, /<summary>Market<\/summary>/);
  assert.match(html, /<summary>SMC overlays<\/summary>/);
  assert.match(html, /<summary>Verification<\/summary>/);
  assert.match(html, /<summary>Stats<\/summary>/);
  assert.match(html, /<summary>Developer<\/summary>/);
  assert.match(html, /Load Market/);
  assert.doesNotMatch(html, /class="table"/);
});

it("converts candle timestamps to chart seconds without altering OHLC data", async () => {
  const { mapCandlesToChart } = await vite.ssrLoadModule("/src/utils/chartDataMapper.js");
  const candle = { time: 1767225600000, open: 10, high: 12, low: 8, close: 11, volume: 20 };
  assert.deepEqual(mapCandlesToChart([candle]), [
    { time: 1767225600, open: 10, high: 12, low: 8, close: 11 },
  ]);
  assert.equal(candle.time, 1767225600000);
});
