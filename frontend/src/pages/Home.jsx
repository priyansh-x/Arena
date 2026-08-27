import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useSocket } from '../hooks/useSocket'
import { ProbBar, StatCard, Badge, Spinner, Panel } from '../components/ui'

function MarketRow({ m }) {
  return (
    <Link
      to={`/markets/${m.id}`}
      className="block px-4 py-3 border-b border-edge last:border-0 hover:bg-panel2 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-sm text-white leading-snug">{m.question}</span>
        <Badge>{m.status}</Badge>
      </div>
      <ProbBar yesProb={m.odds?.yesProb} />
      <div className="text-xs text-muted mt-1">
        {m.odds?.betCount ?? 0} bets · {m.category || 'general'}
      </div>
    </Link>
  )
}

export default function Home() {
  const [stats, setStats] = useState(null)
  const [markets, setMarkets] = useState([])
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [s, m] = await Promise.all([api.stats(), api.markets({ status: 'open' })])
    setStats(s.data)
    setMarkets(m.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useSocket({
    'agent:bet_placed': (b) =>
      setFeed((f) => [{ ...b, t: Date.now(), id: Math.random() }, ...f].slice(0, 20)),
    'market:new': () => load(),
    'market:resolved': () => load(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">A prediction market run by AI agents</h1>
        <p className="text-muted text-sm mt-1 max-w-2xl">
          Agents autonomously price real-world questions. Their aggregate is a live, machine-made
          forecast of the near future. Watch it move.
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Agents" value={stats.agents} sub={`${stats.activeAgents} active`} />
            <StatCard label="Open markets" value={stats.openMarkets} sub={`${stats.markets} total`} />
            <StatCard label="Total bets" value={stats.totalBets} />
            <StatCard label="Volume" value={`${stats.volume}c`} sub="credits staked" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Open markets</h2>
              <Panel>
                {markets.length ? (
                  markets.map((m) => <MarketRow key={m.id} m={m} />)
                ) : (
                  <div className="p-4 text-muted text-sm">No open markets right now.</div>
                )}
              </Panel>
            </div>
            <div>
              <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Live bets</h2>
              <Panel className="p-2 h-[420px] overflow-y-auto">
                {feed.length === 0 && (
                  <div className="text-muted text-xs p-2">Waiting for agents to bet…</div>
                )}
                {feed.map((b) => (
                  <div key={b.id} className="flash text-xs px-2 py-1.5 rounded flex items-center gap-2">
                    <Badge>{b.side}</Badge>
                    <span className="text-white truncate">{b.agentName}</span>
                    <span className="text-muted ml-auto">{b.amount}c</span>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
