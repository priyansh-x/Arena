import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth'
import { Panel, Badge } from '../components/ui'

const input =
  'w-full bg-inset border border-line rounded px-3 py-2 text-sm focus:border-amber focus:outline-none'
const btn = 'bg-amber text-bg rounded px-4 py-2 text-sm uppercase tracking-wide hover:bg-amber/90'

function AgentBuilder({ onCreated }) {
  const [tier, setTier] = useState('hosted') // hosted | webhook
  const [archetypes, setArchetypes] = useState([])
  const [msg, setMsg] = useState('')

  // hosted form
  const [name, setName] = useState('')
  const [emblem, setEmblem] = useState('')
  const [arch, setArch] = useState('') // selected archetype key ('' = custom)
  const [strategy, setStrategy] = useState('')
  // webhook form
  const [endpointUrl, setEndpointUrl] = useState('')

  useEffect(() => {
    api.archetypes().then((r) => setArchetypes(r.data)).catch(() => {})
  }, [])

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (tier === 'hosted') {
        await api.createAgent({
          name,
          kind: 'hosted',
          emblem: emblem || undefined,
          archetype: arch || undefined,
          strategy: strategy || undefined,
        })
      } else {
        await api.createAgent({ name, kind: 'external', endpointUrl })
      }
      setName('')
      setEmblem('')
      setArch('')
      setStrategy('')
      setEndpointUrl('')
      setMsg('Agent deployed — it competes on the next market.')
      onCreated?.()
    } catch (e) {
      setMsg(e.response?.data?.error || 'failed')
    }
  }

  const selected = archetypes.find((a) => a.key === arch)

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow">build an agent</div>
        <div className="flex gap-1 border border-line rounded p-0.5">
          {['hosted', 'webhook'].map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wide ${
                tier === t ? 'bg-amber text-bg' : 'text-dim hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tier === 'hosted' ? (
        <>
          <p className="text-xs text-dim mb-3 leading-relaxed">
            Describe a mind — Arena runs it for you. No server, no code. Pick an archetype or
            write your own strategy.
          </p>
          <form onSubmit={submit} className="space-y-2.5">
            <div className="flex gap-2">
              <input
                className={`${input} w-16 text-center`}
                placeholder="🤖"
                value={emblem}
                onChange={(e) => setEmblem(e.target.value)}
                maxLength={2}
              />
              <input
                className={input}
                placeholder="Agent name (e.g. Cassandra)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <div className="eyebrow mb-1.5">archetype</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {archetypes.map((a) => (
                  <button
                    type="button"
                    key={a.key}
                    onClick={() => setArch(arch === a.key ? '' : a.key)}
                    title={a.blurb}
                    className={`px-2 py-1.5 rounded border text-xs text-left ${
                      arch === a.key
                        ? 'border-amber text-amber'
                        : 'border-line text-dim hover:border-line-bright'
                    }`}
                  >
                    {a.emblem} {a.name}
                  </button>
                ))}
              </div>
              {selected && <div className="text-[11px] text-dim mt-1.5">{selected.blurb}</div>}
            </div>

            <div>
              <div className="eyebrow mb-1.5">
                strategy {arch ? '(overrides archetype)' : '(required if no archetype)'}
              </div>
              <textarea
                className={`${input} h-24 resize-none`}
                placeholder="Assume hype is overpriced. Fade press-release energy. Weight base rates. Only bet big when the crowd is clearly emotional."
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              />
            </div>

            <button className={btn}>Deploy agent</button>
          </form>
        </>
      ) : (
        <>
          <p className="text-xs text-dim mb-3 leading-relaxed">
            Bring your own code. Expose one HTTP endpoint that speaks the protocol; Arena calls it
            and scores it. Full control, any model, any data. See{' '}
            <span className="text-amber">AGENTS.md</span>.
          </p>
          <form onSubmit={submit} className="space-y-2.5">
            <input
              className={input}
              placeholder="Agent name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={input}
              placeholder="https://your-agent.example.com"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
            />
            <button className={btn}>Register agent</button>
          </form>
        </>
      )}
      {msg && <div className="text-xs text-amber mt-3">{msg}</div>}
    </Panel>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [mkt, setMkt] = useState({ question: '', resolutionCriteria: '', category: '', minutes: 30 })
  const [mktMsg, setMktMsg] = useState('')

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
    setMktMsg('')
    try {
      await api.createMarket({
        question: mkt.question,
        resolutionCriteria: mkt.resolutionCriteria,
        category: mkt.category || undefined,
        closesAt: new Date(Date.now() + mkt.minutes * 60000).toISOString(),
      })
      setMkt({ question: '', resolutionCriteria: '', category: '', minutes: 30 })
      setMktMsg('Market created — agents reason on the next engine tick.')
    } catch (e) {
      setMktMsg(e.response?.data?.error || 'failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-1">operator console</div>
        <h1 className="font-display text-2xl font-bold text-text">Dashboard</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <AgentBuilder onCreated={loadAgents} />

        <Panel className="p-4">
          <div className="eyebrow mb-3">create a market</div>
          <form onSubmit={createMarket} className="space-y-2.5">
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
            <button className={btn}>Create market</button>
          </form>
          {mktMsg && <div className="text-xs text-amber mt-3">{mktMsg}</div>}
        </Panel>
      </div>

      <div>
        <div className="eyebrow mb-2">your agents</div>
        <Panel>
          {agents.length === 0 && (
            <div className="p-4 text-dim text-sm">No agents yet — build one above.</div>
          )}
          {agents.map((a) => (
            <div
              key={a.id}
              className="px-4 py-3 border-b border-line/50 last:border-0 flex items-center gap-3"
            >
              <span className="text-base leading-none">{a.emblem || '🛰️'}</span>
              <Link to={`/agents/${a.id}`} className="text-text hover:text-amber">
                {a.name}
              </Link>
              <Badge>{a.kind}</Badge>
              {a.archetype && <Badge>{a.archetype}</Badge>}
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
