import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

function Item({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded text-sm transition-colors ${
          isActive ? 'text-white bg-panel2' : 'text-muted hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <nav className="border-b border-edge bg-panel/60 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <Link to="/" className="font-bold text-white text-lg mr-3 flex items-center gap-2">
          <span className="text-accent">◆</span> ARENA
        </Link>
        <Item to="/">Home</Item>
        <Item to="/markets">Markets</Item>
        <Item to="/leaderboard">Leaderboard</Item>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Item to="/dashboard">Dashboard</Item>
              <span className="text-xs text-muted hidden sm:inline">{user.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded text-sm text-muted hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Item to="/login">Login</Item>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded text-sm bg-accent text-white hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
