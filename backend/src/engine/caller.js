// Fan out a market to every active agent (built-in, hosted, external), collect
// reasoned positions (side + amount + confidence + thesis), write them, and
// snapshot the resulting odds.
//
// No queue in v1: Promise-free sequential loop so momentum/contrarian agents see
// evolving odds. Each agent has its own timeout. See ARCHITECTURE.md / AGENT_MODEL.md.

const prisma = require('../lib/prisma')
const { runAgent } = require('../agents/runner')
const { agentResponseSchema } = require('../validators/agentSchemas')
const { yesProb } = require('../services/odds')
const { recordSnapshot } = require('./snapshot')
const socket = require('../lib/socket')

const TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS) || 10000

// context handed to every agent (docs/AGENT_MODEL.md §4)
function buildContext(market, agent, state) {
  return {
    market: {
      id: market.id,
      question: market.question,
      description: market.description,
      resolutionCriteria: market.resolutionCriteria,
      category: market.category,
      closesAt: market.closesAt,
    },
    state,
    you: { name: agent.name, balance: agent.balance },
  }
}

async function callExternal(agent, ctx) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const resp = await fetch(agent.endpointUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // flatten a few legacy fields for backwards compatibility with v1 agents
      body: JSON.stringify({
        ...ctx,
        marketId: ctx.market.id,
        question: ctx.market.question,
        description: ctx.market.description,
        resolutionCriteria: ctx.market.resolutionCriteria,
        closesAt: ctx.market.closesAt,
        yourBalance: ctx.you.balance,
      }),
      signal: controller.signal,
    })
    if (resp.status === 204) return { skip: true }
    return { body: await resp.json() }
  } finally {
    clearTimeout(timer)
  }
}

// one agent against a market; writes a position or a failure log. returns position|null
async function callAgent(agent, market, state) {
  const started = Date.now()
  const ctx = buildContext(market, agent, state)
  let raw
  let responsePayload = null

  try {
    if (agent.kind === 'external') {
      const r = await callExternal(agent, ctx)
      if (r.skip) return null
      raw = r.body
    } else {
      // builtin or hosted — run in-process
      raw = await runAgent(agent, ctx)
      if (!raw || raw.side === 'PASS') return null
    }
    responsePayload = raw
  } catch (err) {
    await prisma.log.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        status: err.name === 'AbortError' ? 'timeout' : 'error',
        latencyMs: Date.now() - started,
        requestPayload: ctx,
        responsePayload: { error: String(err.message || err) },
      },
    })
    return null
  }

  const parsed = agentResponseSchema.safeParse(raw)
  if (!parsed.success) {
    await prisma.log.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        status: 'error',
        latencyMs: Date.now() - started,
        requestPayload: ctx,
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
        requestPayload: ctx,
        responsePayload: { raw, error: 'insufficient balance' },
      },
    })
    return null
  }

  const position = await prisma.$transaction(async (tx) => {
    const pos = await tx.position.create({
      data: {
        agentId: agent.id,
        marketId: market.id,
        side: bet.side,
        amount,
        confidence: bet.confidence,
        thesis: bet.thesis || null,
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
        requestPayload: ctx,
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
  const existing = await prisma.position.findMany({
    where: { marketId: market.id },
    select: { side: true, amount: true, confidence: true, thesis: true },
  })

  let yesPool = 0
  let noPool = 0
  let betCount = existing.length
  let topThesis = null
  for (const p of existing) {
    if (p.side === 'YES') yesPool += p.amount
    else noPool += p.amount
    if (p.thesis && (!topThesis || p.amount > topThesis.amount)) {
      topThesis = { side: p.side, thesis: p.thesis, amount: p.amount }
    }
  }

  const minutesToClose = Math.max(0, Math.round((new Date(market.closesAt) - Date.now()) / 60000))

  let placed = 0
  for (const agent of agents) {
    const state = {
      yesProb: yesProb(yesPool, noPool),
      yesPool,
      noPool,
      betCount,
      minutesToClose,
      topThesis: topThesis ? { side: topThesis.side, thesis: topThesis.thesis } : null,
    }
    try {
      const pos = await callAgent(agent, market, state)
      if (pos) {
        placed++
        betCount++
        if (pos.side === 'YES') yesPool += pos.amount
        else noPool += pos.amount
        if (pos.thesis && (!topThesis || pos.amount > topThesis.amount)) {
          topThesis = { side: pos.side, thesis: pos.thesis, amount: pos.amount }
        }
      }
    } catch (err) {
      console.error(`[caller] agent ${agent.id} failed:`, err.message)
    }
  }

  await recordSnapshot(market.id)
  return { placed, agents: agents.length }
}

module.exports = { fanOut, callAgent, buildContext }
