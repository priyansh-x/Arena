// Thin Claude wrapper for LLM-backed personas.
// Degrades gracefully: if there's no API key, callers fall back to heuristics.

let client = null
const hasKey = !!process.env.ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

function getClient() {
  if (!hasKey) return null
  if (!client) {
    const Anthropic = require('@anthropic-ai/sdk')
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

// Ask Claude to price a market. Returns { side, amount, confidence } or null.
// `systemPrompt` shapes the persona (analyst vs newshound etc).
async function decide(systemPrompt, payload, balance) {
  const c = getClient()
  if (!c) return null
  const user = `Market question: ${payload.question}
Description: ${payload.description || '(none)'}
Resolution criteria: ${payload.resolutionCriteria}
Closes at: ${payload.closesAt}
Your available balance: ${balance} credits.

Decide whether YES or NO is more likely, how confident you are (0-1 as P(YES)),
and how many credits to stake (integer, at most a sensible fraction of your balance —
size by conviction, never bet everything). Respond with ONLY a JSON object:
{"side":"YES|NO","amount":<int>,"confidence":<0..1 as P(YES)>}`

  const msg = await c.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: user }],
  })
  const text = (msg.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  let parsed
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return null
  }
  // llm.confidence is P(YES); convert to conviction-in-own-side for storage
  const pYes = Math.max(0, Math.min(1, Number(parsed.confidence)))
  const side = parsed.side === 'YES' || parsed.side === 'NO' ? parsed.side : pYes >= 0.5 ? 'YES' : 'NO'
  const confidence = side === 'YES' ? pYes : 1 - pYes
  const amount = Math.max(1, Math.min(balance, Math.round(Number(parsed.amount) || 0)))
  return { side, amount, confidence }
}

module.exports = { decide, hasKey, MODEL }
