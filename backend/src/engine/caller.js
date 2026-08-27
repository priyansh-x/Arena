// Fan out a market to every active agent (built-in + external), collect bets,
// write positions/transactions/logs, and snapshot the resulting odds.
//
// No queue in v1: this is Promise.allSettled over agents with a per-agent
// timeout. The seam to a Redis-backed worker lives here (see ARCHITECTURE.md).

const prisma = require('../lib/prisma')
const { personas } = require('../agents/personas')
const { agentResponseSchema } = require('../validators/agentSchemas')
const { yesProb } = require('../services/odds')
const { recordSnapshot } = require('./snapshot')
const socket = require('../lib/socket')

const TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS) || 10000

function buildPayload(market, balance) {
  return {
    marketId: market.id,
    question: market.question,
    description: market.description,
    resolutionCriteria: market.resolutionCriteria,
    closesAt: market.closesAt,
    yourBalance: balance,
  }
}

async function callExternal(agent, payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const resp = await fetch(agent.endpointUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (resp.status === 204) return { skip: true }
    const body = await resp.json()
    return { body }
  } finally {
    clearTimeout(timer)
  }
}

async function callBuiltin(agent, payload, ctx) {
  const fn = personas[agent.persona]
  if (!fn) return { skip: true }
  const body = await fn(payload, ctx)
  if (!body || body.side === 'PASS') return { skip: true }
  return { body }
}

// process a single agent against a market; returns the created position (or null)
async function callAgent(agent, market, currentOdds) {
  const started = Date.now()
  const payload = buildPayload(market, agent.balance)
  const ctx = { balance: agent.balance, yesProb: currentOdds }
  let raw
  let status = 'success'
  let responsePayload = null

  try {
    const result =
      agent.kind === 'builtin'
        ? await callBuiltin(agent, payload, ctx)
        : await callExternal(agent, payload)
    if (result.skip) return null
    raw = result.body
    responsePayload = raw
  } catch (err) {
    status = err.name === 'AbortError' ? 'timeout' : 'error'
    responsePayload = { error: String(err.message || err) }
    await prisma.log.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        status,
        latencyMs: Date.now() - started,
        requestPayload: payload,
        responsePayload,
      },
    })
    return null
  }

  // validate + clamp
  const parsed = agentResponseSchema.safeParse(raw)
  if (!parsed.success) {
    await prisma.log.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        status: 'error',
        latencyMs: Date.now() - started,
        requestPayload: payload,
        responsePayload: { raw, error: parsed.error.message },
      },
    })
    return null
  }

  const bet = parsed.data
  const amount = Math.min(bet.amount, agent.balance)
  if (amount <= 0) {
    await prisma.log.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        status: 'error',
        latencyMs: Date.now() - started,
        requestPayload: payload,
        responsePayload: { raw, error: 'insufficient balance' },
      },
    })
    return null
  }

  // write position + bet transaction + log, decrement balance atomically
  const position = await prisma.$transaction(async (tx) => {
    const pos = await tx.position.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        side: bet.side,
        amount,
        confidence: bet.confidence,
      },
    })
    await tx.transaction.create({
      data: { agentId: agent.id, marketId: market.id, amount, type: 'bet' },
    })
    await tx.agent.update({ where: { id: agent.id }, data: { balance: { decrement: amount } } })
    await tx.log.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        status: 'success',
        latencyMs: Date.now() - started,
        requestPayload: payload,
        responsePayload,
      },
    })
    return pos
  })

  socket.betPlaced(market.id, agent.name, bet.side, amount)
  return position
}

// fan out to all active agents for a market
async function fanOut(market) {
  const agents = await prisma.agent.findMany({ where: { active: true } })
  // seed current odds from any existing positions
  const existing = await prisma.position.findMany({
    where: { marketId: market.id },
    select: { side: true, amount: true },
  })
  let yesPool = 0
  let noPool = 0
  for (const p of existing) {
    if (p.side === 'YES') yesPool += p.amount
    else noPool += p.amount
  }

  // call agents sequentially-ish so momentum/contrarian see evolving odds,
  // but don't let one slow agent block forever (each has its own timeout).
  let placed = 0
  for (const agent of agents) {
    const odds = yesProb(yesPool, noPool)
    try {
      const pos = await callAgent(agent, market, odds)
      if (pos) {
        placed++
        if (pos.side === 'YES') yesPool += pos.amount
        else noPool += pos.amount
      }
    } catch (err) {
      // never let the engine crash on one agent
      console.error(`[caller] agent ${agent.id} failed:`, err.message)
    }
  }

  await recordSnapshot(market.id)
  return { placed, agents: agents.length }
}

module.exports = { fanOut, callAgent, buildPayload }
