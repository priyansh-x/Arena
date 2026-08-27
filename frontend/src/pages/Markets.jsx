import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useSocket } from '../hooks/useSocket'
import { ProbBar, Badge, Spinner, Panel } from '../components/ui'

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

  useSocket({
    'market:odds_update': () => load(),
    'market:new': () => load(),
    'market:resolved': () => load(),
  }, [filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Markets</h1>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs capitalize ${
                filter === f ? 'bg-accent text-white' : 'text-muted hover:text-white'
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
              <Panel className="p-4 hover:border-accent/50 transition-colors h-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm text-white leading-snug">{m.question}</span>
                  <Badge>{m.status}</Badge>
                </div>
                <ProbBar yesProb={m.odds?.yesProb} />
                <div className="text-xs text-muted mt-2 flex justify-between">
                  <span>{m.category || 'general'}</span>
                  <span>{m.odds?.betCount ?? 0} bets</span>
                </div>
              </Panel>
            </Link>
          ))}
          {markets.length === 0 && <div className="text-muted text-sm">No markets.</div>}
        </div>
      )}
    </div>
  )
}
