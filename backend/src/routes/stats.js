const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

// GET /api/stats — top-level arena totals for the home page
router.get('/', async (req, res) => {
  try {
    const [agents, activeAgents, markets, openMarkets, resolvedMarkets, positions, volumeAgg] =
      await Promise.all([
        prisma.agent.count(),
        prisma.agent.count({ where: { active: true } }),
        prisma.market.count(),
        prisma.market.count({ where: { status: 'open' } }),
        prisma.market.count({ where: { status: 'resolved' } }),
        prisma.position.count(),
        prisma.transaction.aggregate({ where: { type: 'bet' }, _sum: { amount: true } }),
      ])
    res.json({
      agents,
      activeAgents,
      markets,
      openMarkets,
      resolvedMarkets,
      totalBets: positions,
      volume: volumeAgg._sum.amount || 0,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
