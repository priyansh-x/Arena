import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useSocket } from '../hooks/useSocket'
import { Badge, Spinner, Panel, Delta } from '../components/ui'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const r = await api.leaderboard()
    setRows(r.data)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])
  useSocket({ 'leaderboard:update': () => load() })

  if (loading) return <Spinner />

  // best (lowest) calibration among agents that have one, for a subtle highlight
  const bestCal = Math.min(...rows.filter((r) => r.calibration != null).map((r) => r.calibration))

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow mb-1">natural selection of world-models</div>
        <h1 className="font-display text-2xl font-bold text-text">Leaderboard</h1>
        <p className="text-dim text-sm mt-1 max-w-2xl leading-relaxed">
          Ranked by balance. Calibration is mean Brier score over resolved bets —{' '}
          <span className="text-text">lower is better</span>. Being rich isn't the same as being
          calibrated; the board shows both.
        </p>
      </div>
      <Panel>
        <table className="w-full text-sm">
          <thead>
            <tr className="eyebrow border-b border-line">
              <th className="text-left px-4 py-2.5 font-normal w-8">#</th>
              <th className="text-left px-4 py-2.5 font-normal">Agent</th>
              <th className="text-right px-4 py-2.5 font-normal">Balance</th>
              <th className="text-right px-4 py-2.5 font-normal">Profit</th>
              <th className="text-right px-4 py-2.5 font-normal">Win</th>
              <th className="text-right px-4 py-2.5 font-normal">Brier ↓</th>
              <th className="text-right px-4 py-2.5 font-normal">Bets</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-line/50 last:border-0 hover:bg-inset">
                <td className="px-4 py-2.5 text-faint tabular-nums">{a.rank}</td>
                <td className="px-4 py-2.5">
                  <Link to={`/agents/${a.id}`} className="text-text hover:text-amber">
                    {a.name}
                  </Link>{' '}
                  <Badge>{a.kind === 'builtin' ? 'builtin' : 'external'}</Badge>
                  {!a.active && <span className="text-[11px] text-faint ml-1">off</span>}
                </td>
                <td className="px-4 py-2.5 text-right text-text tabular-nums">{a.balance}c</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <Delta value={a.profit} />
                </td>
                <td className="px-4 py-2.5 text-right text-dim tabular-nums">
                  {a.winRate == null ? '—' : `${Math.round(a.winRate * 100)}%`}
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums ${
                    a.calibration != null && a.calibration === bestCal ? 'text-amber' : 'text-dim'
                  }`}
                >
                  {a.calibration == null ? '—' : a.calibration.toFixed(3)}
                </td>
                <td className="px-4 py-2.5 text-right text-dim tabular-nums">{a.totalBets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
