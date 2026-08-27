// Record a market's current odds as a Snapshot (time series for charts +
// the recorded aggregate forecast). Emits an odds update.

const prisma = require('../lib/prisma')
const { yesProb } = require('../services/odds')
const socket = require('../lib/socket')

async function recordSnapshot(marketId) {
  const positions = await prisma.position.findMany({
    where: { marketId },
    select: { side: true, amount: true },
  })
  let yesPool = 0
  let noPool = 0
  for (const p of positions) {
    if (p.side === 'YES') yesPool += p.amount
    else noPool += p.amount
  }
  const prob = yesProb(yesPool, noPool)
  const snap = await prisma.snapshot.create({
    data: { marketId, yesPool, noPool, yesProb: prob },
  })
  socket.oddsUpdate(marketId, prob, yesPool, noPool)
  return snap
}

module.exports = { recordSnapshot }
