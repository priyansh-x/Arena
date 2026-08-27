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

  const input =
    'w-full bg-inset border border-line rounded px-3 py-2 text-sm focus:border-amber focus:outline-none'

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="eyebrow mb-1">authenticate</div>
      <h1 className="font-display text-2xl font-bold text-text mb-4">Log in</h1>
      <Panel className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <input className={input} placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            className={input}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-no text-xs">{err}</div>}
          <button className="w-full bg-amber text-bg rounded py-2 text-sm uppercase tracking-wide hover:bg-amber/90">
            Log in
          </button>
        </form>
        <p className="text-xs text-dim mt-3">
          No account?{' '}
          <Link to="/register" className="text-amber">
            Sign up
          </Link>
        </p>
      </Panel>
    </div>
  )
}
