import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../auth'
import { useSocket } from '../hooks/useSocket'
import { ProbBar, Badge, Spinner, Panel } from '../components/ui'

export default function MarketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [market, setMarket] = useState(null)
  const [snaps, setSnaps] = useState([])
  const [resolving, setResolving] = useState(false)

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([api.market(id), api.marketSnapshots(id)])
    setMarket(m.data)
    setSnaps(s.data)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useSocket(
    {
      'market:odds_update': (p) => {
        if (p.marketId === id) load()
      },
      'agent:bet_placed': (p) => {
        if (p.marketId === id) load()
      },
      'market:resolved': (p) => {
        if (p.marketId === id) load()
      },
    },
    [id]
  )

  async function resolve(outcome) {
    setResolving(true)
    try {
      await api.resolveMarket(id, outcome)
      await load()
    } catch (e) {
      alert(e.response?.data?.error || e.message)
    } finally {
      setResolving(false)
    }
  }

  if (!market) return <Spinner />

  const chartData = snaps.map((s) => ({
    t: new Date(s.createdAt).toLocaleTimeString(),
    yes: Math.round(s.yesProb * 100),
  }))
  const isOwner = user && market.creatorId === user.id
  const canResolve = isOwner && market.status !== 'resolved'

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>{market.status}</Badge>
          {market.category && <Badge>{market.category}</Badge>}
          {market.outcome && <Badge>{market.outcome}</Badge>}
        </div>
        <h1 className="text-xl font-bold text-white">{market.question}</h1>
        <p className="text-muted text-sm mt-1">{market.description}</p>
        <p className="text-xs text-muted mt-2">
          <span className="text-gray-400">Resolves:</span> {market.resolutionCriteria}
        </p>
        <p className="text-xs text-muted">
          Closes {new Date(market.closesAt).toLocaleString()}
        </p>
      </div>

      <Panel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm uppercase tracking-wide text-muted">Aggregate forecast</span>
          <span className="text-2xl font-bold text-yes">
            {Math.round((market.odds?.yesProb ?? 0.5) * 100)}%{' '}
            <span className="text-xs text-muted font-normal">YES</span>
          </span>
        </div>
        <ProbBar yesProb={market.odds?.yesProb} showLabels={false} />
        {chartData.length > 1 && (
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="t" tick={{ fill: '#8b8b9e', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#8b8b9e', fontSize: 10 }} width={28} />
                <Tooltip
                  contentStyle={{ background: '#14141c', border: '1px solid #2a2a3a' }}
                  labelStyle={{ color: '#8b8b9e' }}
                />
                <ReferenceLine y={50} stroke="#2a2a3a" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="yes" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {canResolve && (
        <Panel className="p-4">
          <div className="text-sm text-muted mb-2">Resolve this market (creator only)</div>
          <div className="flex gap-2">
            <button
              disabled={resolving}
              onClick={() => resolve('YES')}
              className="px-4 py-2 rounded bg-yes/20 text-yes border border-yes/40 hover:bg-yes/30 disabled:opacity-50"
            >
              Resolve YES
            </button>
            <button
              disabled={resolving}
              onClick={() => resolve('NO')}
              className="px-4 py-2 rounded bg-no/20 text-no border border-no/40 hover:bg-no/30 disabled:opacity-50"
            >
              Resolve NO
            </button>
          </div>
        </Panel>
      )}

      <div>
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">
          Positions ({market.positions.length})
        </h2>
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-edge">
                <th className="text-left px-4 py-2 font-normal">Agent</th>
                <th className="text-left px-4 py-2 font-normal">Side</th>
                <th className="text-right px-4 py-2 font-normal">Amount</th>
                <th className="text-right px-4 py-2 font-normal">Conf</th>
              </tr>
            </thead>
            <tbody>
              {market.positions.map((p) => (
                <tr key={p.id} className="border-b border-edge/50 last:border-0">
                  <td className="px-4 py-2">
                    <Link to={`/agents/${p.agent.id}`} className="text-white hover:text-accent">
                      {p.agent.name}
                    </Link>{' '}
                    {p.agent.kind === 'builtin' && <Badge>builtin</Badge>}
                  </td>
                  <td className="px-4 py-2">
                    <Badge>{p.side}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">{p.amount}c</td>
                  <td className="px-4 py-2 text-right text-muted">
                    {Math.round(p.confidence * 100)}%
                  </td>
                </tr>
              ))}
              {market.positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-muted text-xs">
                    No bets yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}
