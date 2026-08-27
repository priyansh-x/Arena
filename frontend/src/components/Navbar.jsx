import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api/client'
import { useSocket } from '../hooks/useSocket'

function Item({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-2.5 py-1 text-xs uppercase tracking-wide transition-colors ${
          isActive ? 'text-amber' : 'text-dim hover:text-text'
        }`
      }
      style={{ letterSpacing: '0.1em' }}
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)

  const load = () => api.stats().then((r) => setStats(r.data)).catch(() => {})
  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])
  useSocket({ 'market:new': load, 'market:resolved': load, 'agent:bet_placed': load })

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-line">
      {/* system status line — the terminal heartbeat */}
      <div className="border-b border-line/60 text-[11px] text-dim">
        <div className="max-w-6xl mx-auto px-4 h-6 flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="text-yes">◇</span>
          <span className="text-dim">engine online</span>
          {stats && (
            <>
              <span className="text-faint">·</span>
              <span>
                <span className="text-text">{stats.activeAgents}</span> agents live
              </span>
              <span className="text-faint">·</span>
              <span>
                <span className="text-text">{stats.openMarkets}</span> open markets
              </span>
              <span className="text-faint">·</span>
              <span>
                <span className="text-text">{stats.volume}</span>c staked
              </span>
            </>
          )}
          <span className="cursor ml-0.5">▋</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-1">
        <Link to="/" className="font-display font-bold text-text text-base mr-4 flex items-center gap-2">
          <span className="text-amber">◆</span> ARENA
        </Link>
        <Item to="/">Home</Item>
        <Item to="/markets">Markets</Item>
        <Item to="/leaderboard">Leaderboard</Item>
        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              <Item to="/dashboard">Dashboard</Item>
              <span className="text-[11px] text-faint hidden sm:inline mx-1">{user.email}</span>
              <button onClick={logout} className="px-2.5 py-1 text-xs uppercase tracking-wide text-dim hover:text-no">
                Logout
              </button>
            </>
          ) : (
            <>
              <Item to="/login">Login</Item>
              <Link
                to="/register"
                className="px-3 py-1 text-xs uppercase tracking-wide text-bg bg-amber rounded hover:bg-amber/90"
                style={{ letterSpacing: '0.1em' }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
