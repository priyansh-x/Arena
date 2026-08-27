// Runs an in-process agent (builtin or hosted) against a market and returns a
// decision { side, amount, confidence, thesis } | null.
//
// Order: if an LLM key is present and the agent has a reasoning prompt, reason
// with Claude. Otherwise fall back to a per-archetype heuristic that STILL
// produces a distinct side + a short thesis, so the arena is alive and legible
// without any API key.

const llm = require('./llm')
const { archetype } = require('./archetypes')

// stake a fraction of balance scaled by conviction (distance from 0.5)
function sizeBet(balance, confidence, aggression = 1) {
  const conviction = Math.abs(confidence - 0.5) * 2 // 0..1
  const frac = (0.02 + conviction * 0.08) * aggression // ~2%..10% * aggression
  return Math.max(1, Math.min(balance, Math.round(balance * frac)))
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// heuristic decision by archetype key — { side, confidence, thesis, aggression }
function heuristic(key, state) {
  const p = state.yesProb ?? 0.5
  const lopsided = Math.abs(p - 0.5) // 0..0.5
  switch (key) {
    case 'contrarian':
    case 'skeptic': {
      const side = p >= 0.5 ? 'NO' : 'YES'
      const confidence = 0.5 + lopsided
      return {
        side,
        confidence,
        aggression: 1,
        thesis: pick([
          `Crowd is ${Math.round(p * 100)}% YES — that consensus looks emotional, fading it.`,
          `Everyone's leaning one way; the overlooked case is on the ${side} side.`,
          `Hype priced in. Taking ${side} against the herd.`,
        ]),
      }
    }
    case 'momentum':
    case 'newshound': {
      const side = p >= 0.5 ? 'YES' : 'NO'
      const confidence = Math.max(p, 1 - p)
      return {
        side,
        confidence,
        aggression: 1,
        thesis: pick([
          `Trend is ${side}; riding the crowd at ${Math.round(p * 100)}% YES.`,
          `Momentum favours ${side}, leaning in.`,
          `Latest signal points ${side}, trading with it.`,
        ]),
      }
    }
    case 'degenerate': {
      const side = p >= 0.5 ? 'YES' : 'NO'
      const confidence = 0.5 + Math.max(lopsided, 0.2)
      return {
        side,
        confidence,
        aggression: 2.2,
        thesis: pick([`All in on ${side}, feels right.`, `${side}. Big. No notes.`, `Backing up the truck on ${side}.`]),
      }
    }
    case 'analyst':
    case 'quant': {
      // pull slightly toward base-rate 0.5, mild edge
      const side = p >= 0.5 ? 'YES' : 'NO'
      const confidence = 0.5 + lopsided * 0.6
      return {
        side,
        confidence,
        aggression: 0.8,
        thesis: pick([
          `Base rate + crowd both lean ${side}; edge is thin, sizing small.`,
          `EV marginally favours ${side} at the current price.`,
          `${side}, but the market is close to fair — low conviction.`,
        ]),
      }
    }
    default: {
      // wildcard / random / unknown
      const side = Math.random() < 0.5 ? 'YES' : 'NO'
      return {
        side,
        confidence: 0.45 + Math.random() * 0.2,
        aggression: 1,
        thesis: pick([`Independent read says ${side}.`, `Gut call: ${side}.`, `Going ${side} on my own priors.`]),
      }
    }
  }
}

// resolve the reasoning prompt + archetype key for an agent
function agentProfile(agent) {
  const key = agent.archetype || agent.persona || 'wildcard'
  const arch = archetype(key)
  const systemPrompt =
    agent.systemPrompt ||
    (arch && arch.systemPrompt) ||
    'You are an independent forecaster competing in a prediction market.'
  return { key, systemPrompt }
}

async function runAgent(agent, ctx) {
  const { key, systemPrompt } = agentProfile(agent)

  // try real reasoning first
  if (llm.hasKey) {
    try {
      const out = await llm.reason(systemPrompt, ctx, agent.model)
      if (out) return out
    } catch (err) {
      console.error(`[runner] llm failed for ${agent.name}:`, err.message)
      // fall through to heuristic
    }
  }

  // heuristic fallback
  const h = heuristic(key, ctx.state || {})
  return {
    side: h.side,
    confidence: h.confidence,
    amount: sizeBet(ctx.you.balance, h.confidence, h.aggression),
    thesis: h.thesis,
  }
}

module.exports = { runAgent, agentProfile, sizeBet }
