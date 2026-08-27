// Auto-resolution hooks. A resolver inspects a closed market and returns
// 'YES' | 'NO' | null (null = can't decide yet, leave for a human).
//
// v1 ships a single honest placeholder: `coinflip`, a random oracle used for
// autoResolve demo markets so the full loop (open -> bet -> close -> resolve ->
// settle) runs completely unattended. Real resolvers (price feeds, USGS, sports
// APIs) slot in here keyed by category without touching the scheduler.

const RESOLVERS = {
  // honest placeholder — a coin, not a claim about reality
  coinflip: async () => (Math.random() < 0.5 ? 'YES' : 'NO'),
}

// pick a resolver for a market. Only autoResolve markets are ever auto-resolved.
function resolverFor(market) {
  if (!market.autoResolve) return null
  // future: map market.category -> a real resolver. For now everything coinflips.
  return RESOLVERS.coinflip
}

async function decideOutcome(market) {
  const r = resolverFor(market)
  if (!r) return null
  try {
    return await r(market)
  } catch {
    return null
  }
}

module.exports = { decideOutcome, RESOLVERS }
