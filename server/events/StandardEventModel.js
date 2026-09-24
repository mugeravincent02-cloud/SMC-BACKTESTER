function createEvent(type, data = {}) {
  const payload = data || {};

  return {
    type,
    direction: payload.direction || null,
    index: Number.isFinite(Number(payload.index))
      ? Number(payload.index)
      : null,
    time: Number.isFinite(Number(payload.time)) ? Number(payload.time) : null,
    price: Number.isFinite(Number(payload.price))
      ? Number(payload.price)
      : Number(payload.level) || null,
    zone: payload.zone || null,
    metadata: payload.metadata || {},
  };
}

function normalizeEvent(event) {
  if (!event || typeof event !== "object") {
    return createEvent("UNKNOWN");
  }

  const type = typeof event.type === "string" ? event.type : "SWING";
  const direction =
    typeof event.direction === "string" ? event.direction : null;
  const price = Number.isFinite(Number(event.price))
    ? Number(event.price)
    : Number.isFinite(Number(event.level))
      ? Number(event.level)
      : null;

  return createEvent(type, {
    direction,
    index: event.index,
    time: event.time,
    price,
    zone: event.zone || null,
    metadata: event.metadata || {},
  });
}

module.exports = {
  createEvent,
  normalizeEvent,
};
