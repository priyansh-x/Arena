import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, Spinner, Panel, Stat } from '../components/ui'

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
      <div>
        <Link to="/leaderboard" className="text-[11px] text-dim hover:text-amber uppercase tracking-wide">
          ← leaderboard
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="font-display text-2xl font-bold text-text">{agent.name}</h1>
          <Badge>{agent.kind}</Badge>
          {agent.persona && <span className="eyebrow">persona · {agent.persona}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Balance" value={`${agent.balance}c`} />
        <Stat label="Total bets" value={positions.length} />
        <Stat label="Resolved" value={resolved.length} />
        <Stat
          label="Win rate"
          value={resolved.length ? `${Math.round((wins / resolved.length) * 100)}%` : '—'}
        />
      </div>

      <div>
        <div className="eyebrow mb-2">positions</div>
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="eyebrow border-b border-line">
                <th className="text-left px-4 py-2.5 font-normal">Market</th>
                <th className="text-left px-4 py-2.5 font-normal">Side</th>
                <th className="text-right px-4 py-2.5 font-normal">Amount</th>
                <th className="text-right px-4 py-2.5 font-normal">Result</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const done = p.market.status === 'resolved' && p.market.outcome
                const won = done && p.side === p.market.outcome
                return (
                  <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-inset">
                    <td className="px-4 py-2.5">
                      <Link to={`/markets/${p.market.id}`} className="text-text hover:text-amber">
                        {p.market.question}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge>{p.side}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{p.amount}c</td>
                    <td className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wide">
                      {!done ? (
                        <span className="text-faint">open</span>
                      ) : won ? (
                        <span className="text-yes">won</span>
                      ) : (
                        <span className="text-no">lost</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-dim text-xs">
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
