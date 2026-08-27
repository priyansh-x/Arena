const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const { scorePosition, meanBrier } = require('../services/calibration')

const STARTING = Number(process.env.AGENT_STARTING_BALANCE) || 1000

// GET /api/leaderboard — ranked agents with profit, win rate, and calibration
router.get('/', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        positions: {
          include: { market: { select: { status: true, outcome: true } } },
        },
      },
    })

    const rows = agents.map((a) => {
      const resolved = a.positions.filter(
        (p) => p.market.status === 'resolved' && p.market.outcome
      )
      const wins = resolved.filter((p) => p.side === p.market.outcome).length
      const briers = resolved.map((p) => scorePosition(p, p.market.outcome))
      return {
        id: a.id,
        name: a.name,
        kind: a.kind,
        persona: a.persona,
        archetype: a.archetype,
        emblem: a.emblem,
        bio: a.bio,
        active: a.active,
        balance: a.balance,
        profit: a.balance - STARTING,
        totalBets: a.positions.length,
        resolvedBets: resolved.length,
        wins,
        winRate: resolved.length ? wins / resolved.length : null,
        calibration: meanBrier(briers), // lower is better; null if no resolved bets
      }
    })

    rows.sort((x, y) => y.balance - x.balance)
    rows.forEach((r, i) => (r.rank = i + 1))
    res.json(rows)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
