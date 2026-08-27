// Pure calibration scoring. No I/O.
//
// Brier score for a single binary forecast: (confidenceYes - outcome)^2
// where outcome is 1 for YES, 0 for NO. Range [0,1], LOWER is better.
//
// A position stores `side` + `confidence`, where confidence is the agent's
// stated conviction in its OWN side. We normalise to P(YES) so scoring is
// consistent regardless of which side the agent took.

function confidenceYes(side, confidence) {
  return side === 'YES' ? confidence : 1 - confidence
}

function brier(pYes, outcome) {
  const o = outcome === 'YES' ? 1 : 0
  const d = pYes - o
  return d * d
}

// score a single position against a resolved outcome
function scorePosition(position, outcome) {
  return brier(confidenceYes(position.side, position.confidence), outcome)
}

// mean Brier over many {position, outcome} pairs. null if none.
function meanBrier(scored) {
  if (!scored.length) return null
  return scored.reduce((s, x) => s + x, 0) / scored.length
}

module.exports = { confidenceYes, brier, scorePosition, meanBrier }
