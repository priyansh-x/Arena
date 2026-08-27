// Integration tests against a real DB. Requires DATABASE_URL (docker compose up).
// Uses a unique email per run so it's repeatable without cleanup.

const { test, before, after } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

// engine must not run during tests
process.env.ENGINE_INLINE = 'false'
const app = require('../src/app')
const prisma = require('../src/lib/prisma')

const email = `test_${Date.now()}@arena.test`
const password = 'testpassword123'
let token
let marketId

after(async () => {
  await prisma.$disconnect()
})

test('health', async () => {
  const r = await request(app).get('/health')
  assert.equal(r.status, 200)
  assert.equal(r.body.status, 'ok')
})

test('register + login', async () => {
  const reg = await request(app).post('/api/auth/register').send({ email, password })
  assert.equal(reg.status, 201)
  const login = await request(app).post('/api/auth/login').send({ email, password })
  assert.equal(login.status, 200)
  assert.ok(login.body.token)
  token = login.body.token
})

test('auth/me requires token', async () => {
  const noauth = await request(app).get('/api/auth/me')
  assert.equal(noauth.status, 401)
  const me = await request(app).get('/api/auth/me').set('authorization', `Bearer ${token}`)
  assert.equal(me.status, 200)
  assert.equal(me.body.email, email)
})

test('create market (auth) then resolve it', async () => {
  const create = await request(app)
    .post('/api/markets')
    .set('authorization', `Bearer ${token}`)
    .send({
      question: 'Will this integration test pass?',
      resolutionCriteria: 'Resolves YES when the suite is green.',
      closesAt: new Date(Date.now() + 3600_000).toISOString(),
    })
  assert.equal(create.status, 201)
  marketId = create.body.id

  const forecast = await request(app).get(`/api/markets/${marketId}/forecast`)
  assert.equal(forecast.status, 200)
  assert.equal(forecast.body.betCount, 0)

  const resolve = await request(app)
    .post(`/api/markets/${marketId}/resolve`)
    .set('authorization', `Bearer ${token}`)
    .send({ outcome: 'YES' })
  assert.equal(resolve.status, 200)
  assert.equal(resolve.body.outcome, 'YES')
})

test('create market rejects bad body', async () => {
  const r = await request(app)
    .post('/api/markets')
    .set('authorization', `Bearer ${token}`)
    .send({ question: 'x' }) // too short, missing criteria
  assert.equal(r.status, 400)
})

test('leaderboard + stats are public', async () => {
  const lb = await request(app).get('/api/leaderboard')
  assert.equal(lb.status, 200)
  assert.ok(Array.isArray(lb.body))
  const stats = await request(app).get('/api/stats')
  assert.equal(stats.status, 200)
  assert.ok(typeof stats.body.markets === 'number')
})
