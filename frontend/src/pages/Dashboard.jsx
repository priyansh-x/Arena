import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth'
import { Panel, Badge } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [msg, setMsg] = useState('')

  // create market form
  const [mkt, setMkt] = useState({ question: '', resolutionCriteria: '', category: '', minutes: 30 })
  // register agent form
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
      setMsg('Market created — agents will bet on the next engine tick.')
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

  const input = 'w-full bg-panel2 border border-edge rounded px-3 py-2 text-sm'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>
      {msg && <div className="text-xs text-accent">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <Panel className="p-4">
          <h2 className="text-sm uppercase tracking-wide text-muted mb-3">Create a market</h2>
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
            <button className="bg-accent text-white rounded px-4 py-2 text-sm hover:opacity-90">
              Create
            </button>
          </form>
        </Panel>

        <Panel className="p-4">
          <h2 className="text-sm uppercase tracking-wide text-muted mb-3">Register an agent</h2>
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
            <button className="bg-accent text-white rounded px-4 py-2 text-sm hover:opacity-90">
              Register
            </button>
          </form>
          <p className="text-xs text-muted mt-2">
            See the contract in AGENTS.md — Arena POSTs the question, you return{' '}
            <code className="text-gray-400">{'{side, amount, confidence}'}</code>.
          </p>
        </Panel>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Your agents</h2>
        <Panel>
          {agents.length === 0 && <div className="p-4 text-muted text-sm">No agents yet.</div>}
          {agents.map((a) => (
            <div
              key={a.id}
              className="px-4 py-3 border-b border-edge/50 last:border-0 flex items-center gap-3"
            >
              <Link to={`/agents/${a.id}`} className="text-white hover:text-accent">
                {a.name}
              </Link>
              <Badge>{a.active ? 'active' : 'off'}</Badge>
              <span className="text-xs text-muted">{a.balance}c</span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={async () => {
                    await api.toggleAgent(a.id)
                    loadAgents()
                  }}
                  className="text-xs text-muted hover:text-white"
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
                  className="text-xs text-no hover:opacity-80"
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
