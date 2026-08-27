// Real-world resolvers — resolve markets against actual data, keyless & public.
// Each resolver: async (market) => 'YES' | 'NO' | null   (null = undecidable, leave for a human)
//
// Baselines captured at market creation live in market.resolverData.

const TIMEOUT = 8000

async function getJSON(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const r = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(timer)
  }
}

// Coinbase BTC-USD spot price (public, keyless)
async function btcSpot() {
  const j = await getJSON('https://api.coinbase.com/v2/prices/BTC-USD/spot')
  const amount = Number(j?.data?.amount)
  if (!Number.isFinite(amount)) throw new Error('bad price')
  return amount
}

const resolvers = {
  // "Will BTC be higher than at market open?" — needs a baseline captured at creation.
  btc_up: async (market) => {
    const baseline = Number(market.resolverData?.baselinePrice)
    if (!Number.isFinite(baseline)) return null
    const now = await btcSpot()
    return now > baseline ? 'YES' : 'NO'
  },

  // "Will a magnitude 5.0+ earthquake be recorded today?" — USGS count endpoint (public).
  usgs_quake_m5: async (market) => {
    const start = new Date(market.opensAt).toISOString()
    const end = new Date().toISOString()
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&starttime=${encodeURIComponent(
      start
    )}&endtime=${encodeURIComponent(end)}&minmagnitude=5`
    const j = await getJSON(url)
    return (j?.count ?? 0) > 0 ? 'YES' : 'NO'
  },
}

// baseline capture hooks — called by the generator when a market is created
const baselines = {
  btc_up: async () => ({ baselinePrice: await btcSpot() }),
}

module.exports = { resolvers, baselines, btcSpot }
