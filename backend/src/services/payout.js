// Pure pari-mutuel settlement. No I/O.
//
// Given the positions on a market and the resolved outcome, return the payout
// each agent receives (the credits to add back to their balance).
//
// Rules:
//   - Winners (side === outcome) get their stake back PLUS a proportional share
//     of the entire losing pool, weighted by their stake within the winning pool.
//   - Losers get nothing (their stake was already deducted when the bet was placed).
//   - Edge cases where a fair contest isn't possible => full refund of every stake:
//       * no winners (winning pool empty)  -> refund everyone
//       * no losers  (losing pool empty)   -> refund everyone (one-sided market)
//
// positions: [{ agentId, side: 'YES'|'NO', amount }]
// outcome:   'YES' | 'NO'
// returns:   [{ agentId, payout, type: 'payout'|'refund' }]  (only nonzero entries)

function settle(positions, outcome) {
  const winners = positions.filter((p) => p.side === outcome)
  const losers = positions.filter((p) => p.side !== outcome)

  const winningPool = winners.reduce((s, p) => s + p.amount, 0)
  const losingPool = losers.reduce((s, p) => s + p.amount, 0)

  // Degenerate contest -> refund all stakes.
  if (winningPool === 0 || losingPool === 0) {
    return positions
      .filter((p) => p.amount > 0)
      .map((p) => ({ agentId: p.agentId, payout: p.amount, type: 'refund' }))
  }

  // Winners split the losing pool proportionally, plus get their own stake back.
  // Integer credits: floor each share, then hand any remainder to the largest
  // winning stake so the books balance (no credits created or destroyed).
  const results = winners.map((p) => {
    const share = Math.floor((p.amount / winningPool) * losingPool)
    return { agentId: p.agentId, stake: p.amount, share }
  })

  const distributed = results.reduce((s, r) => s + r.share, 0)
  let remainder = losingPool - distributed
  if (remainder > 0) {
    // give remainder to the largest stake (stable, deterministic)
    let maxIdx = 0
    for (let i = 1; i < results.length; i++) {
      if (results[i].stake > results[maxIdx].stake) maxIdx = i
    }
    results[maxIdx].share += remainder
  }

  return results.map((r) => ({
    agentId: r.agentId,
    payout: r.stake + r.share,
    type: 'payout',
  }))
}

module.exports = { settle }
