// Built-in agent personas. Each is async (payload, ctx) => {side, amount, confidence} | null
// ctx = { balance, yesProb }  (yesProb = current crowd odds)
//
// LLM personas call llm.decide(); without an API key they fall back to a heuristic
// so the arena is always alive.

const llm = require('./llm')

// stake a fraction of balance scaled by how far confidence is from a coin flip
function sizeBet(balance, confidence) {
  const conviction = Math.abs(confidence - 0.5) * 2 // 0..1
  const frac = 0.02 + conviction * 0.08 // 2%..10% of balance
  return Math.max(1, Math.min(balance, Math.round(balance * frac)))
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

const personas = {
  // baseline: coin flip, small stake
  random: async (_payload, ctx) => {
    const side = Math.random() < 0.5 ? 'YES' : 'NO'
    const confidence = rand(0.45, 0.6)
    return { side, amount: sizeBet(ctx.balance, 0.5), confidence }
  },

  // bets with the crowd
  momentum: async (_payload, ctx) => {
    const p = ctx.yesProb
    const side = p >= 0.5 ? 'YES' : 'NO'
    const confidence = Math.max(p, 1 - p) // conviction in own side
    return { side, amount: sizeBet(ctx.balance, confidence), confidence }
  },

  // bets against the crowd
  contrarian: async (_payload, ctx) => {
    const p = ctx.yesProb
    const side = p >= 0.5 ? 'NO' : 'YES'
    const confidence = 0.5 + Math.abs(p - 0.5) // more contrarian when crowd is lopsided
    return { side, amount: sizeBet(ctx.balance, confidence), confidence }
  },

  // LLM: careful analyst
  analyst: async (payload, ctx) => {
    const out = await llm.decide(
      'You are a careful, calibrated forecaster. Reason step by step but report only honest, well-calibrated probabilities. Avoid overconfidence.',
      payload,
      ctx.balance
    )
    if (out) return out
    // heuristic fallback: mild crowd-follow
    return personas.momentum(payload, ctx)
  },

  // LLM: news/recency-weighted
  newshound: async (payload, ctx) => {
    const out = await llm.decide(
      'You are a news-driven forecaster. Weight recent evidence and base rates. Report an honest P(YES) and stake by conviction.',
      payload,
      ctx.balance
    )
    if (out) return out
    // heuristic fallback: slight contrarian on extreme crowd odds, else follow
    const p = ctx.yesProb
    if (p > 0.8 || p < 0.2) return personas.contrarian(payload, ctx)
    return personas.momentum(payload, ctx)
  },
}

// default roster booted by the seed
const DEFAULT_ROSTER = [
  { name: 'Coinflip', persona: 'random' },
  { name: 'Momo', persona: 'momentum' },
  { name: 'Contra', persona: 'contrarian' },
  { name: 'The Analyst', persona: 'analyst' },
  { name: 'Newshound', persona: 'newshound' },
]

module.exports = { personas, DEFAULT_ROSTER, sizeBet }
