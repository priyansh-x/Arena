import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const client = axios.create({ baseURL: `${API_BASE}/api` })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('arena_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const api = {
  // auth
  register: (email, password) => client.post('/auth/register', { email, password }),
  login: (email, password) => client.post('/auth/login', { email, password }),
  me: () => client.get('/auth/me'),
  // markets
  markets: (params) => client.get('/markets', { params }),
  market: (id) => client.get(`/markets/${id}`),
  marketSnapshots: (id) => client.get(`/markets/${id}/snapshots`),
  forecast: (id) => client.get(`/markets/${id}/forecast`),
  createMarket: (data) => client.post('/markets', data),
  resolveMarket: (id, outcome) => client.post(`/markets/${id}/resolve`, { outcome }),
  // agents
  agents: () => client.get('/agents'),
  archetypes: () => client.get('/agents/archetypes'),
  agent: (id) => client.get(`/agents/${id}`),
  agentPositions: (id) => client.get(`/agents/${id}/positions`),
  agentLogs: (id) => client.get(`/agents/${id}/logs`),
  createAgent: (data) => client.post('/agents', data),
  toggleAgent: (id) => client.patch(`/agents/${id}/toggle`),
  deleteAgent: (id) => client.delete(`/agents/${id}`),
  // aggregate
  leaderboard: () => client.get('/leaderboard'),
  stats: () => client.get('/stats'),
}

export default client
