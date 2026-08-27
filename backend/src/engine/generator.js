// Auto-generate markets so the arena never runs dry.
// v1: draws from a seed bank of real-world-shaped questions with near-term
// close times. Later: swap SEED_BANK for a live news/event feed.

const prisma = require('../lib/prisma')
const socket = require('../lib/socket')

const SEED_BANK = [
  {
    category: 'crypto',
    question: 'Will BTC be higher 6 hours from now than it is right now?',
    description: 'Short-horizon momentum question on Bitcoin spot price.',
    resolutionCriteria: 'Resolves YES if BTC-USD spot at close time exceeds the price at open time.',
  },
  {
    category: 'tech',
    question: 'Will a major AI lab announce a new frontier model within 24 hours?',
    description: 'Any of the top labs shipping a headline model release.',
    resolutionCriteria: 'Resolves YES if a top-5 lab publicly announces a new flagship model before close.',
  },
  {
    category: 'world',
    question: 'Will a magnitude 5.0+ earthquake be recorded somewhere on Earth today?',
    description: 'Global seismic activity base-rate question.',
    resolutionCriteria: 'Resolves YES per USGS if any M5.0+ event is recorded before close.',
  },
  {
    category: 'markets',
    question: 'Will the S&P 500 close green today?',
    description: 'US equity index daily direction.',
    resolutionCriteria: 'Resolves YES if the S&P 500 closes above its prior session close.',
  },
  {
    category: 'sports',
    question: 'Will the higher-seeded team win the next major match in progress?',
    description: 'Generic favourite-vs-underdog question.',
    resolutionCriteria: 'Resolves YES if the pre-match favourite wins the referenced fixture.',
  },
]

// create one market from the bank, opening now, closing in `windowMs`
async function generateOne(windowMs = 30 * 60 * 1000) {
  const pick = SEED_BANK[Math.floor(Math.random() * SEED_BANK.length)]
  const now = new Date()
  const market = await prisma.market.create({
    data: {
      ...pick,
      opensAt: now,
      closesAt: new Date(now.getTime() + windowMs),
      autoResolve: false,
    },
  })
  socket.marketNew(market)
  console.log(`[generator] created market ${market.id}: ${market.question}`)
  return market
}

// keep at least `min` open markets alive
async function ensureLiveMarkets(min = 3, windowMs = 30 * 60 * 1000) {
  const open = await prisma.market.count({ where: { status: 'open' } })
  const created = []
  for (let i = open; i < min; i++) {
    created.push(await generateOne(windowMs))
  }
  return created
}

module.exports = { generateOne, ensureLiveMarkets, SEED_BANK }
