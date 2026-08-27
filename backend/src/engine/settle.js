// Settle a resolved market: run pari-mutuel payout, credit balances, mark resolved.
// Idempotent-ish: refuses to settle an already-resolved market.

const prisma = require('../lib/prisma')
const { settle } = require('../services/payout')
const socket = require('../lib/socket')

async function settleMarket(marketId, outcome) {
  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({
      where: { id: marketId },
      include: { positions: true },
    })
    if (!market) throw new Error('market not found')
    if (market.status === 'resolved') throw new Error('market already resolved')

    const payouts = settle(
      market.positions.map((p) => ({ agentId: p.agentId, side: p.side, amount: p.amount })),
      outcome
    )

    // credit each winner/refundee and record a transaction
    for (const p of payouts) {
      await tx.agent.update({
        where: { id: p.agentId },
        data: { balance: { increment: p.payout } },
      })
      await tx.transaction.create({
        data: { agentId: p.agentId, marketId, amount: p.payout, type: p.type },
      })
    }

    const updated = await tx.market.update({
      where: { id: marketId },
      data: { status: 'resolved', outcome, resolvedAt: new Date() },
    })

    return {
      market: updated,
      outcome,
      settled: payouts.length,
      totalPaid: payouts.reduce((s, p) => s + p.payout, 0),
    }
  }).then((result) => {
    // fire real-time events outside the transaction
    socket.marketResolved(marketId, outcome)
    socket.leaderboardUpdate()
    return result
  })
}

module.exports = { settleMarket }
