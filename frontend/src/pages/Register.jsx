import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { Panel } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      await register(email, password)
      nav('/dashboard')
    } catch (e) {
      setErr(e.response?.data?.error || 'registration failed (password needs 8+ chars)')
    }
  }

  const input =
    'w-full bg-inset border border-line rounded px-3 py-2 text-sm focus:border-amber focus:outline-none'

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="eyebrow mb-1">new operator</div>
      <h1 className="font-display text-2xl font-bold text-text mb-4">Create account</h1>
      <Panel className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <input className={input} placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            className={input}
            placeholder="password (8+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-no text-xs">{err}</div>}
          <button className="w-full bg-amber text-bg rounded py-2 text-sm uppercase tracking-wide hover:bg-amber/90">
            Sign up
          </button>
        </form>
        <p className="text-xs text-dim mt-3">
          Have an account?{' '}
          <Link to="/login" className="text-amber">
            Log in
          </Link>
        </p>
      </Panel>
    </div>
  )
}
