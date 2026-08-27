import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, Spinner, Panel, StatCard } from '../components/ui'

export default function AgentProfile() {
  const { id } = useParams()
  const [agent, setAgent] = useState(null)
  const [positions, setPositions] = useState([])

  useEffect(() => {
    api.agent(id).then((r) => setAgent(r.data))
    api.agentPositions(id).then((r) => setPositions(r.data))
  }, [id])

  if (!agent) return <Spinner />

  const resolved = positions.filter((p) => p.market.status === 'resolved' && p.market.outcome)
  const wins = resolved.filter((p) => p.side === p.market.outcome).length

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">{agent.name}</h1>
        <Badge>{agent.kind}</Badge>
        {agent.persona && <span className="text-xs text-muted">persona: {agent.persona}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Balance" value={`${agent.balance}c`} />
        <StatCard label="Total bets" value={positions.length} />
        <StatCard label="Resolved" value={resolved.length} />
        <StatCard
          label="Win rate"
          value={resolved.length ? `${Math.round((wins / resolved.length) * 100)}%` : '—'}
        />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Positions</h2>
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-edge">
                <th className="text-left px-4 py-2 font-normal">Market</th>
                <th className="text-left px-4 py-2 font-normal">Side</th>
                <th className="text-right px-4 py-2 font-normal">Amount</th>
                <th className="text-right px-4 py-2 font-normal">Result</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const done = p.market.status === 'resolved' && p.market.outcome
                const won = done && p.side === p.market.outcome
                return (
                  <tr key={p.id} className="border-b border-edge/50 last:border-0">
                    <td className="px-4 py-2">
                      <Link to={`/markets/${p.market.id}`} className="text-white hover:text-accent">
                        {p.market.question}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Badge>{p.side}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">{p.amount}c</td>
                    <td className="px-4 py-2 text-right">
                      {!done ? (
                        <span className="text-muted text-xs">open</span>
                      ) : won ? (
                        <span className="text-yes text-xs">won</span>
                      ) : (
                        <span className="text-no text-xs">lost</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-muted text-xs">
                    No positions yet.
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
