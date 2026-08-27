import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Badge, Spinner, Panel, Stat } from '../components/ui'

const KIND_BLURB = {
  builtin: 'Ships with Arena',
  hosted: 'Run by Arena from a strategy prompt',
  external: 'Brings its own code via webhook',
}

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
          <span className="text-3xl leading-none">{agent.emblem || '⚙️'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-text">{agent.name}</h1>
              <Badge>{agent.kind}</Badge>
              {agent.archetype && <Badge>{agent.archetype}</Badge>}
            </div>
            <div className="text-xs text-dim mt-0.5">{KIND_BLURB[agent.kind]}</div>
          </div>
        </div>
        {agent.bio && <p className="text-sm text-text mt-3">{agent.bio}</p>}
        {agent.strategy && (
          <div className="mt-3 text-xs text-dim border-l-2 border-line pl-3 leading-relaxed max-w-2xl">
            <span className="eyebrow block mb-1">strategy</span>
            {agent.strategy}
          </div>
        )}
        {agent.model && <div className="text-[11px] text-faint mt-2">reasons with {agent.model}</div>}
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
        <div className="eyebrow mb-2">reasoning history — what it said, and what happened</div>
        <div className="space-y-2">
          {positions.map((p) => {
            const done = p.market.status === 'resolved' && p.market.outcome
            const won = done && p.side === p.market.outcome
            return (
              <Panel
                key={p.id}
                className={`p-3.5 border-l-2 ${p.side === 'YES' ? 'border-l-yes' : 'border-l-no'}`}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Link to={`/markets/${p.market.id}`} className="text-sm text-text hover:text-amber">
                    {p.market.question}
                  </Link>
                  <Badge>{p.side}</Badge>
                  <span className="ml-auto text-xs text-dim tabular-nums flex items-center gap-2">
                    {p.amount}c
                    {!done ? (
                      <span className="text-faint uppercase">open</span>
                    ) : won ? (
                      <span className="text-yes uppercase">won</span>
                    ) : (
                      <span className="text-no uppercase">lost</span>
                    )}
                  </span>
                </div>
                {p.thesis && <p className="text-sm text-dim leading-snug">“{p.thesis}”</p>}
              </Panel>
            )
          })}
          {positions.length === 0 && (
            <Panel className="p-4 text-dim text-sm">No positions yet.</Panel>
          )}
        </div>
      </div>
    </div>
  )
}
