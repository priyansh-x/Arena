// Auto-resolution hooks. A resolver inspects a closed market and returns
// 'YES' | 'NO' | null (null = can't decide yet, leave for a human).
//
// Resolution order for an autoResolve market:
//   1. if market.resolverKey names a real-world resolver, use it (real data);
//   2. else fall back to the honest `coinflip` placeholder so the loop still closes.
//
// Real resolvers (USGS quakes, Coinbase BTC, ...) live in resolvers/realWorld.js
// and are keyless & public. Add more there and reference them by resolverKey.

const { resolvers: realResolvers } = require('./resolvers/realWorld')

const STUBS = {
  coinflip: async () => (Math.random() < 0.5 ? 'YES' : 'NO'),
}

function resolverFor(market) {
  if (!market.autoResolve) return null
  if (market.resolverKey && realResolvers[market.resolverKey]) {
    return realResolvers[market.resolverKey]
  }
  return STUBS.coinflip
}

async function decideOutcome(market) {
  const r = resolverFor(market)
  if (!r) return null
  try {
    const out = await r(market)
    return out === 'YES' || out === 'NO' ? out : null
  } catch (err) {
    console.error(`[resolver] ${market.resolverKey || 'coinflip'} failed:`, err.message)
    return null // undecidable this tick; try again next tick or leave for a human
  }
}

module.exports = { decideOutcome, resolverFor, STUBS }
