const { randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const UPSTREAM_URL = 'https://api.binance.com/api/v3/klines';
const read = (object, key) => { try { return object?.[key]; } catch { return undefined; } };
function sanitizeMessage(value) {
  if (typeof value !== 'string') return 'No upstream error message available.';
  let text = value.slice(0, 4096);
  // Do not retain header dumps or messages containing credential metadata.
  if (/authorization|bearer|basic\s|cookie|headers?|password|secret|api[ _-]?key|token|signature/i.test(text)) return '[Sensitive diagnostic message redacted]';
  text = text.replace(/https?:\/\/[^\s"'<>]+/gi, '[URL redacted]')
    .replace(/\b[A-Za-z0-9_+/=-]{32,}\b/g, '[Token redacted]')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return text.slice(0, 240) || 'No upstream error message available.';
}
function requestContext(endpoint) { return { requestId: randomUUID(), endpoint }; }
function logFailure(event, context, params, started, error, response) {
  const upstream = read(error, 'response') ?? response;
  const body = read(upstream, 'data');
  const status = read(upstream, 'status');
  const code = read(error, 'code');
  const providerCode = read(body, 'code');
  const message = read(body, 'msg') ?? (typeof body === 'string' ? body : read(error, 'message'));
  const record = {
    event,
    requestId: typeof context?.requestId === 'string' && /^[a-f0-9-]{36}$/i.test(context.requestId) ? context.requestId : randomUUID(),
    endpoint: ['/api/candles', '/api/smc/swings'].includes(context?.endpoint) ? context.endpoint : 'direct-service-call',
    upstreamHostname: 'api.binance.com',
    upstreamPath: '/api/v3/klines',
    symbol: typeof params.symbol === 'string' && /^[A-Z0-9]+$/.test(params.symbol) ? params.symbol.slice(0, 64) : null,
    interval: typeof params.interval === 'string' && /^[0-9]+[mhdwM]$/.test(params.interval) ? params.interval.slice(0, 8) : null,
    limit: Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 1000 ? params.limit : null,
    elapsedMs: Math.max(0, Math.round(performance.now() - started)),
    errorCode: typeof code === 'string' && /^[A-Z0-9_-]{1,40}$/.test(code) ? code : null,
    upstreamStatus: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    upstreamCode: Number.isFinite(providerCode) ? providerCode : null,
    message: sanitizeMessage(message),
  };
  console.error(JSON.stringify(record));
}
module.exports = { UPSTREAM_URL, requestContext, logFailure, sanitizeMessage };
