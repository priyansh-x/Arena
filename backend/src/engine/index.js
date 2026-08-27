// Engine entry. Can run standalone (`npm run engine`) or inline inside the API
// process (ENGINE_INLINE=true). Runs the scheduler heartbeat and periodically
// tops up markets via the generator so the arena stays alive.

require('dotenv').config()
const scheduler = require('./scheduler')
const { ensureLiveMarkets } = require('./generator')

function start(opts = {}) {
  const tickMs = opts.tickMs || Number(process.env.ENGINE_TICK_MS) || 5000
  const generate = opts.generate ?? (process.env.ENGINE_GENERATE !== 'false')
  const minMarkets = opts.minMarkets || Number(process.env.ENGINE_MIN_MARKETS) || 3

  const handle = scheduler.start(tickMs)

  let genHandle = null
  if (generate) {
    const run = () =>
      ensureLiveMarkets(minMarkets).catch((e) => console.error('[generator]', e.message))
    run()
    genHandle = setInterval(run, opts.generateMs || 60 * 1000)
  }

  return { stop: () => { clearInterval(handle); if (genHandle) clearInterval(genHandle) } }
}

module.exports = { start }

// standalone
if (require.main === module) {
  start()
  console.log('[engine] running standalone')
}
