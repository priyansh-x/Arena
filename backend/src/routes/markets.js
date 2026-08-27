/*
GET    /api/markets                 list (filter ?status= &category=)
POST   /api/markets                 create (auth)
GET    /api/markets/:id             detail + odds + positions + snapshots
POST   /api/markets/:id/resolve     creator posts outcome, triggers settlement
GET    /api/markets/:id/positions
GET    /api/markets/:id/snapshots   odds time series
GET    /api/markets/:id/forecast    aggregate signal (the oracle read)
*/

const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const authMiddleware = require('../middleware/auth')
const { createMarketSchema, resolveMarketSchema } = require('../validators/marketSchemas')
const { yesProb } = require('../services/odds')
const { settleMarket } = require('../engine/settle')

// compute pools + odds from a list of positions
function computeOdds(positions) {
  let yesPool = 0
  let noPool = 0
  for (const p of positions) {
    if (p.side === 'YES') yesPool += p.amount
    else noPool += p.amount
  }
  return { yesPool, noPool, yesProb: yesProb(yesPool, noPool), betCount: positions.length }
}

router.get('/', async (req, res) => {
  try {
    const where = {}
    if (req.query.status) where.status = req.query.status
    if (req.query.category) where.category = req.query.category
    const markets = await prisma.market.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { positions: { select: { side: true, amount: true } } },
    })
    const withOdds = markets.map((m) => {
      const { positions, ...rest } = m
      return { ...rest, odds: computeOdds(positions) }
    })
    res.json(withOdds)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = createMarketSchema.parse(req.body)
    const opensAt = data.opensAt || new Date()
    const closesAt = data.closesAt || new Date(Date.now() + 60 * 60 * 1000)
    if (closesAt <= opensAt) {
      return res.status(400).json({ error: 'closesAt must be after opensAt' })
    }
    const market = await prisma.market.create({
      data: {
        question: data.question,
        description: data.description || '',
        resolutionCriteria: data.resolutionCriteria,
        category: data.category,
        autoResolve: data.autoResolve || false,
        opensAt,
        closesAt,
        creatorId: req.user.id,
      },
    })
    require('../lib/socket').marketNew(market)
    res.status(201).json(market)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: {
        positions: {
          include: { agent: { select: { id: true, name: true, kind: true, persona: true } } },
          orderBy: { createdAt: 'desc' },
        },
        snapshots: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!market) return res.status(404).json({ error: 'market not found' })
    res.json({ ...market, odds: computeOdds(market.positions) })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id/positions', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: { marketId: req.params.id },
      include: { agent: { select: { id: true, name: true, kind: true, persona: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(positions)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id/snapshots', async (req, res) => {
  try {
    const snapshots = await prisma.snapshot.findMany({
      where: { marketId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json(snapshots)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// The oracle read: the aggregate forecast for a market.
router.get('/:id/forecast', async (req, res) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: { positions: { select: { side: true, amount: true, confidence: true } } },
    })
    if (!market) return res.status(404).json({ error: 'market not found' })
    const odds = computeOdds(market.positions)
    // confidence-weighted mean P(YES) across agents, as a second view of the signal
    let cw = null
    if (market.positions.length) {
      const sum = market.positions.reduce(
        (s, p) => s + (p.side === 'YES' ? p.confidence : 1 - p.confidence),
        0
      )
      cw = sum / market.positions.length
    }
    res.json({
      marketId: market.id,
      question: market.question,
      status: market.status,
      outcome: market.outcome,
      poolWeightedYes: odds.yesProb,
      confidenceWeightedYes: cw,
      betCount: odds.betCount,
      closesAt: market.closesAt,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { outcome } = resolveMarketSchema.parse(req.body)
    const market = await prisma.market.findUnique({ where: { id: req.params.id } })
    if (!market) return res.status(404).json({ error: 'market not found' })
    if (market.creatorId && market.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'only the market creator can resolve it' })
    }
    if (market.status === 'resolved') {
      return res.status(400).json({ error: 'market already resolved' })
    }
    const result = await settleMarket(market.id, outcome)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
