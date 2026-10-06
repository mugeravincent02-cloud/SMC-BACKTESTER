const { test } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../../server/app");

function listen(appInstance) {
  return new Promise((resolve) => {
    const server = appInstance.listen(0, () => {
      resolve(server);
    });
  });
}

test("reports healthy application status through the public health endpoint", async () => {
  const server = await listen(app);

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/health`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, "ok");
    assert.equal(payload.service, "smc-backtester");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("rejects invalid backtest payloads without exposing internal errors", async () => {
  const server = await listen(app);

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/backtest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bad: true }),
      },
    );

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid backtest configuration.");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
