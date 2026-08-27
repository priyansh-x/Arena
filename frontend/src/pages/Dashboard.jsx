import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth'
import { Panel, Badge } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [msg, setMsg] = useState('')
  const [mkt, setMkt] = useState({ question: '', resolutionCriteria: '', category: '', minutes: 30 })
  const [agent, setAgent] = useState({ name: '', endpointUrl: '' })

  async function loadAgents() {
    const r = await api.agents()
    setAgents(r.data.filter((a) => a.userId === user.id))
  }
  useEffect(() => {
    loadAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createMarket(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api.createMarket({
        question: mkt.question,
        resolutionCriteria: mkt.resolutionCriteria,
        category: mkt.category || undefined,
        closesAt: new Date(Date.now() + mkt.minutes * 60000).toISOString(),
      })
      setMkt({ question: '', resolutionCriteria: '', category: '', minutes: 30 })
      setMsg('Market created — agents bet on the next engine tick.')
    } catch (e) {
      setMsg(e.response?.data?.error || 'failed')
    }
  }

  async function registerAgent(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api.createAgent(agent)
      setAgent({ name: '', endpointUrl: '' })
      await loadAgents()
      setMsg('Agent registered.')
    } catch (e) {
      setMsg(e.response?.data?.error || 'failed')
    }
  }

  const input =
    'w-full bg-inset border border-line rounded px-3 py-2 text-sm focus:border-amber focus:outline-none'
  const btn = 'bg-amber text-bg rounded px-4 py-2 text-sm uppercase tracking-wide hover:bg-amber/90'

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-1">operator console</div>
        <h1 className="font-display text-2xl font-bold text-text">Dashboard</h1>
      </div>
      {msg && <div className="text-xs text-amber border border-amber/30 rounded px-3 py-2">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <Panel className="p-4">
          <div className="eyebrow mb-3">create a market</div>
          <form onSubmit={createMarket} className="space-y-2">
            <input
              className={input}
              placeholder="Question (e.g. Will X ship by Friday?)"
              value={mkt.question}
              onChange={(e) => setMkt({ ...mkt, question: e.target.value })}
            />
            <input
              className={input}
              placeholder="Resolution criteria"
              value={mkt.resolutionCriteria}
              onChange={(e) => setMkt({ ...mkt, resolutionCriteria: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className={input}
                placeholder="category (optional)"
                value={mkt.category}
                onChange={(e) => setMkt({ ...mkt, category: e.target.value })}
              />
              <input
                type="number"
                className={`${input} w-28`}
                placeholder="mins"
                value={mkt.minutes}
                onChange={(e) => setMkt({ ...mkt, minutes: Number(e.target.value) })}
              />
            </div>
            <button className={btn}>Create</button>
          </form>
        </Panel>

        <Panel className="p-4">
          <div className="eyebrow mb-3">register an agent</div>
          <form onSubmit={registerAgent} className="space-y-2">
            <input
              className={input}
              placeholder="Agent name"
              value={agent.name}
              onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            />
            <input
              className={input}
              placeholder="https://your-agent.example.com"
              value={agent.endpointUrl}
              onChange={(e) => setAgent({ ...agent, endpointUrl: e.target.value })}
            />
            <button className={btn}>Register</button>
          </form>
          <p className="text-xs text-dim mt-2 leading-relaxed">
            Arena POSTs the question; you return{' '}
            <code className="text-amber">{'{side, amount, confidence}'}</code>. Full contract in AGENTS.md.
          </p>
        </Panel>
      </div>

      <div>
        <div className="eyebrow mb-2">your agents</div>
        <Panel>
          {agents.length === 0 && <div className="p-4 text-dim text-sm">No agents yet.</div>}
          {agents.map((a) => (
            <div
              key={a.id}
              className="px-4 py-3 border-b border-line/50 last:border-0 flex items-center gap-3"
            >
              <Link to={`/agents/${a.id}`} className="text-text hover:text-amber">
                {a.name}
              </Link>
              <Badge>{a.active ? 'active' : 'off'}</Badge>
              <span className="text-xs text-dim tabular-nums">{a.balance}c</span>
              <div className="ml-auto flex gap-3">
                <button
                  onClick={async () => {
                    await api.toggleAgent(a.id)
                    loadAgents()
                  }}
                  className="text-[11px] uppercase tracking-wide text-dim hover:text-text"
                >
                  {a.active ? 'deactivate' : 'activate'}
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Delete ${a.name}?`)) {
                      await api.deleteAgent(a.id)
                      loadAgents()
                    }
                  }}
                  className="text-[11px] uppercase tracking-wide text-no hover:opacity-80"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
