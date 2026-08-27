// Claude wrapper for reasoning agents (built-in LLM personas + hosted agents).
// Takes a system prompt (the agent's identity/strategy) and rich market context,
// returns { side, amount, confidence, thesis } or null. Degrades gracefully:
// with no API key, callers fall back to heuristics.

const hasKey = !!process.env.ANTHROPIC_API_KEY
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
let client = null

function getClient() {
  if (!hasKey) return null
  if (!client) {
    const Anthropic = require('@anthropic-ai/sdk')
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

function contextBlock(ctx) {
  const s = ctx.state || {}
  const top = s.topThesis
    ? `\nStrongest opposing view so far (${s.topThesis.side}): "${s.topThesis.thesis}"`
    : ''
  return `MARKET
Q: ${ctx.market.question}
Details: ${ctx.market.description || '(none)'}
Resolves: ${ctx.market.resolutionCriteria}
Category: ${ctx.market.category || 'general'}
Closes: ${ctx.market.closesAt}

CURRENT STATE
Crowd P(YES): ${(s.yesProb ?? 0.5).toFixed(2)}  (YES pool ${s.yesPool ?? 0}c / NO pool ${s.noPool ?? 0}c)
Agents already in: ${s.betCount ?? 0}   Minutes to close: ${s.minutesToClose ?? '?'}${top}

YOU
Name: ${ctx.you.name}   Balance: ${ctx.you.balance}c`
}

// systemPrompt: the agent's reasoning identity. model: optional override.
async function reason(systemPrompt, ctx, model) {
  const c = getClient()
  if (!c) return null
  const user = `${contextBlock(ctx)}

Decide YES or NO, your confidence as P(YES-for-your-side) in [0,1], a stake (integer credits,
size by conviction — never bet your whole balance), and a ONE-sentence thesis explaining why.
Respond with ONLY JSON:
{"side":"YES|NO","amount":<int>,"confidence":<0..1>,"thesis":"<one sentence>"}`

  const msg = await c.messages.create({
    model: model || DEFAULT_MODEL,
    max_tokens: 300,
    system:
      systemPrompt +
      '\n\nYou are competing in Arena, a prediction market for AI agents. Your reasoning is public and scored against reality by calibration (Brier score), so be honest, not loud.',
    messages: [{ role: 'user', content: user }],
  })

  const text = (msg.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  let p
  try {
    p = JSON.parse(match[0])
  } catch {
    return null
  }
  const bal = ctx.you.balance
  const side = p.side === 'YES' || p.side === 'NO' ? p.side : null
  if (!side) return null
  // model reports P(side); store as confidence-in-own-side, clamp
  let confidence = Number(p.confidence)
  if (!Number.isFinite(confidence)) confidence = 0.55
  confidence = Math.max(0, Math.min(1, confidence))
  const amount = Math.max(1, Math.min(bal, Math.round(Number(p.amount) || 0)))
  const thesis = typeof p.thesis === 'string' ? p.thesis.slice(0, 280) : null
  return { side, amount, confidence, thesis }
}

module.exports = { reason, hasKey, DEFAULT_MODEL }
