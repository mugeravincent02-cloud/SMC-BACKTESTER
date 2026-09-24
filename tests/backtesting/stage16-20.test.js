const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  createEvent,
  normalizeEvent,
} = require("../../server/events/StandardEventModel");
const app = require("../../server/app");

function listen(appInstance) {
  return new Promise((resolve) => {
    const server = appInstance.listen(0, () => {
      resolve(server);
    });
  });
}

test("creates consistent event payloads for SMC trade events", () => {
  const event = createEvent("ENTRY", {
    direction: "BULLISH",
    index: 12,
    time: 1710000000,
    price: 101.2,
    zone: { type: "FVG" },
    metadata: { source: "test" },
  });

  assert.equal(event.type, "ENTRY");
  assert.equal(event.direction, "BULLISH");
  assert.equal(event.price, 101.2);
  assert.equal(event.metadata.source, "test");
});

test("normalizes legacy SMC objects into the standard event model", () => {
  const event = normalizeEvent({
    direction: "BEARISH",
    type: "SWING",
    index: 8,
    level: 99.5,
  });

  assert.equal(event.type, "SWING");
  assert.equal(event.direction, "BEARISH");
  assert.equal(event.price, 99.5);
});

test("runs a backtest through the API and returns sanitized review data", async () => {
  const server = await listen(app);

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/backtest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "BTCUSDT",
          timeframe: "1h",
          range: 20,
          initialBalance: 1000,
          riskPercent: 1,
          strategyConfig: { confidence: "medium" },
        }),
      },
    );

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.summary.totalTrades >= 0, true);
    assert.equal(payload.backtest.symbol, "BTCUSDT");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("applies production security headers to API responses", async () => {
  const server = await listen(app);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);

    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
