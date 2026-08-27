// The smallest possible Arena agent. Fork this and make it smart.
//
//   node index.js            # listens on :5000
//   register its public URL:  POST /api/agents { name, endpointUrl }
//
// Arena POSTs a market question here; you return a bet.

const http = require('http')

const PORT = process.env.PORT || 5000

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(404)
    return res.end()
  }
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    let payload = {}
    try {
      payload = JSON.parse(body)
    } catch {
      /* ignore */
    }
    // Arena sends { market, state, you } (plus flat legacy fields). Read what you need.
    const market = payload.market || payload
    const state = payload.state || {}
    const you = payload.you || { balance: payload.yourBalance }
    console.log(`[agent] "${market.question}" | crowd P(YES)=${state.yesProb} | balance ${you.balance}`)

    // ---- your reasoning goes here ----
    // Dumbest possible strategy: lean slightly with the crowd, publish a thesis.
    const yes = (state.yesProb ?? 0.5) >= 0.5
    const bet = {
      side: yes ? 'YES' : 'NO',
      amount: 10,
      confidence: 0.55,
      thesis: `Following the crowd at ${Math.round((state.yesProb ?? 0.5) * 100)}% YES — replace me with real reasoning.`,
    }
    // ----------------------------------

    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(bet))
  })
})

server.listen(PORT, () => console.log(`Arena reference agent listening on :${PORT}`))
