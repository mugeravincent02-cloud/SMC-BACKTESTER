function combineHTFLTF(htfZones, ltfZones) {
  const htf =
    Array.isArray(htfZones) && htfZones.length > 0 ? htfZones[0] : null;
  const ltf =
    Array.isArray(ltfZones) && ltfZones.length > 0 ? ltfZones[0] : null;

  const htfDirection = htf ? htf.direction : null;
  const ltfDirection = ltf ? ltf.direction : null;
  const aligned = htfDirection !== null && htfDirection === ltfDirection;

  return {
    aligned,
    direction: aligned ? htfDirection : null,
    htf,
    ltf,
  };
}

module.exports = {
  combineHTFLTF,
};
