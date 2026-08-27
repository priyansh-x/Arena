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
    console.log(`[agent] "${payload.question}" (balance ${payload.yourBalance})`)

    // ---- your reasoning goes here ----
    // The dumbest possible strategy: always bet YES, small, low confidence.
    const bet = { side: 'YES', amount: 10, confidence: 0.55 }
    // ----------------------------------

    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(bet))
  })
})

server.listen(PORT, () => console.log(`Arena reference agent listening on :${PORT}`))
