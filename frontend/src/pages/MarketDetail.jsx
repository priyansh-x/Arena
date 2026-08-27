import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../auth'
import { useSocket } from '../hooks/useSocket'
import { ProbMeter, Badge, Spinner, Panel } from '../components/ui'

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
      'market:odds_update': (p) => p.marketId === id && load(),
      'agent:bet_placed': (p) => p.marketId === id && load(),
      'market:resolved': (p) => p.marketId === id && load(),
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
    t: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    yes: Math.round(s.yesProb * 100),
  }))
  const isOwner = user && market.creatorId === user.id
  const canResolve = isOwner && market.status !== 'resolved'

  return (
    <div className="space-y-5">
      <div>
        <Link to="/markets" className="text-[11px] text-dim hover:text-amber uppercase tracking-wide">
          ← markets
        </Link>
        <div className="flex items-center gap-2 mt-3 mb-2">
          <Badge>{market.status}</Badge>
          {market.category && (
            <span className="eyebrow">{market.category}</span>
          )}
          {market.outcome && (
            <span className="text-[11px] text-dim">
              resolved <Badge>{market.outcome}</Badge>
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-text leading-tight">{market.question}</h1>
        {market.description && <p className="text-dim text-sm mt-2">{market.description}</p>}
        <div className="mt-3 text-xs text-dim border-l-2 border-line pl-3">
          <span className="text-faint uppercase tracking-wide">resolves</span> {market.resolutionCriteria}
          <br />
          <span className="text-faint uppercase tracking-wide">closes</span>{' '}
          {new Date(market.closesAt).toLocaleString()}
        </div>
      </div>

      <Panel className="p-5">
        <div className="eyebrow mb-3">aggregate forecast · P(YES)</div>
        <ProbMeter yesProb={market.odds?.yesProb} size="lg" />
        {chartData.length > 1 && (
          <div className="h-52 mt-5 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="t" tick={{ fill: '#49514f', fontSize: 10 }} stroke="#1c2325" />
                <YAxis domain={[0, 100]} tick={{ fill: '#49514f', fontSize: 10 }} stroke="#1c2325" width={28} />
                <Tooltip
                  contentStyle={{
                    background: '#111517',
                    border: '1px solid #2b3437',
                    borderRadius: 6,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#7a8688' }}
                  itemStyle={{ color: '#46c66b' }}
                  formatter={(v) => [`${v}%`, 'P(YES)']}
                />
                <ReferenceLine y={50} stroke="#1c2325" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="yes"
                  stroke="#46c66b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {canResolve && (
        <Panel className="p-4">
          <div className="eyebrow mb-2.5">resolve — creator only</div>
          <div className="flex gap-2">
            <button
              disabled={resolving}
              onClick={() => resolve('YES')}
              className="px-4 py-2 rounded text-sm text-yes border border-yes/40 hover:bg-yes/10 disabled:opacity-50"
            >
              Resolve YES
            </button>
            <button
              disabled={resolving}
              onClick={() => resolve('NO')}
              className="px-4 py-2 rounded text-sm text-no border border-no/40 hover:bg-no/10 disabled:opacity-50"
            >
              Resolve NO
            </button>
          </div>
        </Panel>
      )}

      <div>
        <div className="eyebrow mb-2">positions · {market.positions.length}</div>
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="eyebrow border-b border-line">
                <th className="text-left px-4 py-2.5 font-normal">Agent</th>
                <th className="text-left px-4 py-2.5 font-normal">Side</th>
                <th className="text-right px-4 py-2.5 font-normal">Amount</th>
                <th className="text-right px-4 py-2.5 font-normal">P(side)</th>
              </tr>
            </thead>
            <tbody>
              {market.positions.map((p) => (
                <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-inset">
                  <td className="px-4 py-2.5">
                    <Link to={`/agents/${p.agent.id}`} className="text-text hover:text-amber">
                      {p.agent.name}
                    </Link>{' '}
                    {p.agent.kind === 'builtin' && <Badge>builtin</Badge>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge>{p.side}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.amount}c</td>
                  <td className="px-4 py-2.5 text-right text-dim tabular-nums">
                    {Math.round(p.confidence * 100)}%
                  </td>
                </tr>
              ))}
              {market.positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-dim text-xs">
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
