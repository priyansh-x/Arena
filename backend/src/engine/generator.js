// Auto-generate markets so the arena never runs dry.
// Entries with a `resolverKey` resolve against real public data (USGS, Coinbase);
// the rest fall back to the honest coinflip stub. See resolvers/realWorld.js.

const prisma = require('../lib/prisma')
const socket = require('../lib/socket')
const { baselines } = require('./resolvers/realWorld')

const SEED_BANK = [
  {
    category: 'crypto',
    resolverKey: 'btc_up',
    question: 'Will BTC be higher when this market closes than it is right now?',
    description: 'Short-horizon momentum question on Bitcoin spot price (Coinbase BTC-USD).',
    resolutionCriteria: 'Resolves YES if Coinbase BTC-USD spot at close exceeds the price captured at open.',
  },
  {
    category: 'world',
    resolverKey: 'usgs_quake_m5',
    question: 'Will a magnitude 5.0+ earthquake be recorded somewhere on Earth before this closes?',
    description: 'Global seismic activity, resolved live from the USGS feed.',
    resolutionCriteria: 'Resolves YES per USGS if any M5.0+ event is recorded between open and close.',
  },
  {
    category: 'tech',
    question: 'Will a major AI lab announce a new frontier model within this window?',
    description: 'Any top lab shipping a headline model release.',
    resolutionCriteria: 'Resolves YES if a top-5 lab publicly announces a new flagship model before close.',
  },
  {
    category: 'markets',
    question: 'Will the S&P 500 close green today?',
    description: 'US equity index daily direction.',
    resolutionCriteria: 'Resolves YES if the S&P 500 closes above its prior session close.',
  },
]

// create one market from the bank, opening now, closing in `windowMs`
async function generateOne(windowMs = 30 * 60 * 1000) {
  const pick = SEED_BANK[Math.floor(Math.random() * SEED_BANK.length)]
  const now = new Date()

  // capture a baseline for real resolvers that need one (e.g. BTC open price)
  let resolverData = null
  if (pick.resolverKey && baselines[pick.resolverKey]) {
    try {
      resolverData = await baselines[pick.resolverKey]()
    } catch (err) {
      console.error(`[generator] baseline capture failed for ${pick.resolverKey}:`, err.message)
    }
  }

  const market = await prisma.market.create({
    data: {
      category: pick.category,
      question: pick.question,
      description: pick.description,
      resolutionCriteria: pick.resolutionCriteria,
      resolverKey: pick.resolverKey || null,
      resolverData,
      opensAt: now,
      closesAt: new Date(now.getTime() + windowMs),
      autoResolve: true,
    },
  })
  socket.marketNew(market)
  console.log(`[generator] created ${market.id}: ${market.question} [${pick.resolverKey || 'coinflip'}]`)
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
