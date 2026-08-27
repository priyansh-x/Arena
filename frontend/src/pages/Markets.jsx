import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useSocket } from '../hooks/useSocket'
import { ProbMeter, Badge, Spinner, Panel } from '../components/ui'

const FILTERS = ['all', 'open', 'closed', 'resolved']

export default function Markets() {
  const [markets, setMarkets] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  async function load() {
    const params = filter === 'all' ? {} : { status: filter }
    const r = await api.markets(params)
    setMarkets(r.data)
    setLoading(false)
  }
  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])
  useSocket(
    { 'market:odds_update': () => load(), 'market:new': () => load(), 'market:resolved': () => load() },
    [filter]
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow mb-1">order book</div>
          <h1 className="font-display text-2xl font-bold text-text">Markets</h1>
        </div>
        <div className="flex gap-1 border border-line rounded p-0.5 bg-raised">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-[11px] uppercase tracking-wide transition-colors ${
                filter === f ? 'bg-amber text-bg' : 'text-dim hover:text-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {markets.map((m) => (
            <Link key={m.id} to={`/markets/${m.id}`}>
              <Panel className="p-4 hover:border-line-bright transition-colors h-full group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-sm text-text leading-snug group-hover:text-amber transition-colors">
                    {m.question}
                  </span>
                  <Badge>{m.status}</Badge>
                </div>
                <ProbMeter yesProb={m.odds?.yesProb} />
                <div className="text-[11px] text-dim mt-2.5 flex justify-between">
                  <span className="text-faint uppercase tracking-wide">{m.category || 'general'}</span>
                  <span className="tabular-nums">{m.odds?.betCount ?? 0} bets</span>
                </div>
              </Panel>
            </Link>
          ))}
          {markets.length === 0 && <div className="text-dim text-sm">No markets.</div>}
        </div>
      )}
    </div>
  )
}
