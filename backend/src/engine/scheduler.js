// The heartbeat. On each tick:
//   1. announce open markets that have reached opensAt (fan out to agents once)
//   2. close markets that have reached closesAt
// Auto-resolution hooks live in generator/oracle later; manual resolve is via API.

const prisma = require('../lib/prisma')
const { fanOut } = require('./caller')
const { decideOutcome } = require('./resolver')
const { settleMarket } = require('./settle')

let running = false

async function tick() {
  if (running) return // don't overlap ticks
  running = true
  try {
    const now = new Date()

    // 1. announce newly-open markets
    const toAnnounce = await prisma.market.findMany({
      where: { status: 'open', announced: false, opensAt: { lte: now } },
    })
    for (const market of toAnnounce) {
      // mark announced first so a slow fan-out isn't double-triggered next tick
      await prisma.market.update({ where: { id: market.id }, data: { announced: true } })
      try {
        const r = await fanOut(market)
        console.log(`[scheduler] announced ${market.id} — ${r.placed}/${r.agents} bets placed`)
      } catch (err) {
        console.error(`[scheduler] fanOut failed for ${market.id}:`, err.message)
      }
    }

    // 2. close expired markets
    const toClose = await prisma.market.updateMany({
      where: { status: 'open', closesAt: { lte: now } },
      data: { status: 'closed' },
    })
    if (toClose.count > 0) console.log(`[scheduler] closed ${toClose.count} market(s)`)

    // 3. auto-resolve eligible closed markets
    const toResolve = await prisma.market.findMany({
      where: { status: 'closed', autoResolve: true },
    })
    for (const market of toResolve) {
      const outcome = await decideOutcome(market)
      if (!outcome) continue
      try {
        const r = await settleMarket(market.id, outcome)
        console.log(`[scheduler] auto-resolved ${market.id} -> ${outcome} (${r.totalPaid}c paid)`)
      } catch (err) {
        console.error(`[scheduler] auto-resolve failed for ${market.id}:`, err.message)
      }
    }
  } catch (err) {
    console.error('[scheduler] tick error:', err.message)
  } finally {
    running = false
  }
}

function start(intervalMs = 5000) {
  console.log(`[scheduler] started, tick every ${intervalMs}ms`)
  tick()
  return setInterval(tick, intervalMs)
}

module.exports = { start, tick }
