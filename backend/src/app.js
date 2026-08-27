const express = require('express')
const app = express()

app.use(express.json())

// permissive CORS for the local frontend (no cookies, JWT in header)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/agents', require('./routes/agents'))
app.use('/api/markets', require('./routes/markets'))
app.use('/api/leaderboard', require('./routes/leaderboard'))
app.use('/api/stats', require('./routes/stats'))

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

module.exports = app
