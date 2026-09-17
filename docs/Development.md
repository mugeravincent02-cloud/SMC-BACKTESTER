# Sprint 4.5

Completed

- Shared SMC configuration
- Liquidity detector
- Equal High detection
- Equal Low detection

Lessons

- Avoid duplicated algorithms.
- Keep configuration centralized.
- Return computed liquidity price for reuse.

Next

- Previous Day High
- Previous Day Low

## Pre-Stage 01 repairs — 2026-09-18

This is a repair pass authorized before Stage 01, not progression to a new feature stage. See the append-only audit in `docs/Baseline.md` for what changed, where, how, why, and validation results.

Use Node.js 22.18.0 or a compatible version supported by the installed Vite release. From the repository root, start the backend:

```powershell
npm.cmd ci
npm.cmd start
```

The backend explicitly loads `server/.env`; PORT defaults to 5000 when omitted. `server/.env.example` documents the local settings. Existing environment variables take precedence. In another terminal, install and start the frontend:

```powershell
npm.cmd --prefix client ci
npm.cmd --prefix client run dev
```

The frontend proxy targets port 5000 by default. If the backend uses another port, set `API_PROXY_TARGET` using `client/.env.example`. Existing `.env` files should be retained rather than overwritten.

Repeatable verification from the repository root:

```powershell
npm.cmd test
npm.cmd --prefix server test
npm.cmd --prefix client test
npm.cmd --prefix client run lint
npm.cmd --prefix client run build
```

Root and server test commands run the same 22 backend tests. The client command runs four rendered-component/data-mapping checks; these are not browser interaction tests.

Manual browser checks:

1. Open the Vite URL and confirm candles, statistics, visible timeframe labels, and the candle table load.
2. Select ETHUSDT, 5m, and 100 candles, then click Load Market. Verify the statistics identify the selected market/timeframe.
3. Enter a candle limit of 0 and click Load Market. Expect the integer-range error while controls and prior data stay visible. Set 100 and click again; verify recovery without reloading the page.
4. Resize below 900px and back. Verify controls, chart, statistics and table remain accessible; the table should scroll within its own wrapper.
5. Stop the backend, request data, restart the backend, and retry. Verify the page remains usable after failure.

Browser automation was unavailable during this repair pass. Live API/proxy checks passed; the manual interaction and visual checks above still require a browser.
