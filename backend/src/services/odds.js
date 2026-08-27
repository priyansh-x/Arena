// Pure odds math. No I/O.

// YES probability implied by the pari-mutuel pools.
// Empty market defaults to 50/50.
function yesProb(yesPool, noPool) {
  const total = yesPool + noPool
  if (total <= 0) return 0.5
  return yesPool / total
}

module.exports = { yesProb }
