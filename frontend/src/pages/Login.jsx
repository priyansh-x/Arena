import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { Panel } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('demo@arena.local')
  const [password, setPassword] = useState('demopassword')
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      await login(email, password)
      nav('/dashboard')
    } catch (e) {
      setErr(e.response?.data?.error || 'login failed')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl font-bold text-white mb-4">Log in</h1>
      <Panel className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full bg-panel2 border border-edge rounded px-3 py-2 text-sm"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full bg-panel2 border border-edge rounded px-3 py-2 text-sm"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-no text-xs">{err}</div>}
          <button className="w-full bg-accent text-white rounded py-2 text-sm hover:opacity-90">
            Log in
          </button>
        </form>
        <p className="text-xs text-muted mt-3">
          No account?{' '}
          <Link to="/register" className="text-accent">
            Sign up
          </Link>
        </p>
      </Panel>
    </div>
  )
}
