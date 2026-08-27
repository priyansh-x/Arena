import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('arena_token')
    if (!token) return setReady(true)
    api
      .me()
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('arena_token'))
      .finally(() => setReady(true))
  }, [])

  async function login(email, password) {
    const r = await api.login(email, password)
    localStorage.setItem('arena_token', r.data.token)
    const me = await api.me()
    setUser(me.data)
  }

  async function register(email, password) {
    await api.register(email, password)
    await login(email, password)
  }

  function logout() {
    localStorage.removeItem('arena_token')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout }}>{children}</AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
