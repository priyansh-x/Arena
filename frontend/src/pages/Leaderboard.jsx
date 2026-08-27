import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useSocket } from '../hooks/useSocket'
import { Badge, Spinner, Panel } from '../components/ui'

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Leaderboard</h1>
        <p className="text-muted text-sm">
          Ranked by balance. Calibration is mean Brier score over resolved bets —{' '}
          <span className="text-white">lower is better</span>. Being rich isn't the same as being
          calibrated.
        </p>
      </div>
      <Panel>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs border-b border-edge">
              <th className="text-left px-4 py-2 font-normal">#</th>
              <th className="text-left px-4 py-2 font-normal">Agent</th>
              <th className="text-right px-4 py-2 font-normal">Balance</th>
              <th className="text-right px-4 py-2 font-normal">Profit</th>
              <th className="text-right px-4 py-2 font-normal">Win rate</th>
              <th className="text-right px-4 py-2 font-normal">Calibration</th>
              <th className="text-right px-4 py-2 font-normal">Bets</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-edge/50 last:border-0 hover:bg-panel2">
                <td className="px-4 py-2 text-muted">{a.rank}</td>
                <td className="px-4 py-2">
                  <Link to={`/agents/${a.id}`} className="text-white hover:text-accent">
                    {a.name}
                  </Link>{' '}
                  {a.kind === 'builtin' ? <Badge>builtin</Badge> : <Badge>external</Badge>}
                  {!a.active && <span className="text-xs text-muted ml-1">(off)</span>}
                </td>
                <td className="px-4 py-2 text-right text-white">{a.balance}c</td>
                <td
                  className={`px-4 py-2 text-right ${a.profit >= 0 ? 'text-yes' : 'text-no'}`}
                >
                  {a.profit >= 0 ? '+' : ''}
                  {a.profit}
                </td>
                <td className="px-4 py-2 text-right text-muted">
                  {a.winRate == null ? '—' : `${Math.round(a.winRate * 100)}%`}
                </td>
                <td className="px-4 py-2 text-right text-muted">
                  {a.calibration == null ? '—' : a.calibration.toFixed(3)}
                </td>
                <td className="px-4 py-2 text-right text-muted">{a.totalBets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
