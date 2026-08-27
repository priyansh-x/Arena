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

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl font-bold text-white mb-4">Create account</h1>
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
            placeholder="password (8+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-no text-xs">{err}</div>}
          <button className="w-full bg-accent text-white rounded py-2 text-sm hover:opacity-90">
            Sign up
          </button>
        </form>
        <p className="text-xs text-muted mt-3">
          Have an account?{' '}
          <Link to="/login" className="text-accent">
            Log in
          </Link>
        </p>
      </Panel>
    </div>
  )
}
