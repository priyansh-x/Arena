// Boot a live local arena: a diverse built-in roster (distinct archetypes),
// a couple of demo *hosted* agents (defined by strategy prompt), a demo user,
// and a few open markets. Idempotent — safe to run repeatedly.

require('dotenv').config()
const prisma = require('./lib/prisma')
const bcrypt = require('bcrypt')
const { ARCHETYPES } = require('./agents/archetypes')
const { SEED_BANK } = require('./engine/generator')

const STARTING = Number(process.env.AGENT_STARTING_BALANCE) || 1000
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

// built-in roster: one agent per archetype, spread across the strategy matrix
const BUILTIN_ROSTER = [
  { name: 'Ada', archetype: 'analyst' },
  { name: 'Cassandra', archetype: 'skeptic' },
  { name: 'Hendrix', archetype: 'contrarian' },
  { name: 'Scoop', archetype: 'newshound' },
  { name: 'Sigma', archetype: 'quant' },
  { name: 'Momo', archetype: 'momentum' },
  { name: 'YOLO', archetype: 'degenerate' },
  { name: 'Static', archetype: 'wildcard' },
]

// demo hosted agents — defined purely by a strategy prompt, run by Arena
const HOSTED_DEMO = [
  {
    name: 'The Oracle',
    emblem: '🔮',
    archetype: 'analyst', // heuristic hint when no LLM key; systemPrompt is the real strategy
    bio: 'Weighs base rates above all. Slow to move, hard to fool.',
    strategy:
      'Forecast almost entirely from historical base rates. Treat vivid narratives as noise. Only deviate from the base rate when there is specific, verifiable evidence. Bet small and often.',
  },
  {
    name: 'FadeKing',
    emblem: '👑',
    archetype: 'contrarian',
    bio: 'Exists to punish consensus. Bets against anything crowded.',
    strategy:
      'Systematically fade the crowd. The more one-sided the market, the harder you bet the other way. You believe crowds of agents herd. Only concede when the resolution is essentially certain.',
  },
]

async function upsertAgent(where, data) {
  const existing = await prisma.agent.findFirst({ where })
  if (existing) return prisma.agent.update({ where: { id: existing.id }, data })
  return prisma.agent.create({ data: { ...where, ...data } })
}

async function seedBuiltins() {
  for (const a of BUILTIN_ROSTER) {
    const arch = ARCHETYPES[a.archetype]
    await upsertAgent(
      { name: a.name, kind: 'builtin' },
      {
        archetype: a.archetype,
        persona: a.archetype,
        emblem: arch.emblem,
        bio: arch.blurb,
        model: MODEL,
        active: true,
        balance: STARTING,
      }
    )
  }
  console.log(`[seed] ${BUILTIN_ROSTER.length} built-in agents ready`)
}

async function seedHosted() {
  for (const a of HOSTED_DEMO) {
    await upsertAgent(
      { name: a.name, kind: 'hosted' },
      {
        emblem: a.emblem,
        bio: a.bio,
        archetype: a.archetype || null,
        strategy: a.strategy,
        systemPrompt: a.strategy,
        model: MODEL,
        active: true,
        balance: STARTING,
      }
    )
  }
  console.log(`[seed] ${HOSTED_DEMO.length} demo hosted agents ready`)
}

async function seedDemoUser() {
  const email = 'demo@arena.local'
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return existing
  const passwordHash = await bcrypt.hash('demopassword', 10)
  const user = await prisma.user.create({ data: { email, passwordHash } })
  console.log(`[seed] demo user ${email} / demopassword`)
  return user
}

async function seedMarkets(user) {
  const open = await prisma.market.count({ where: { status: 'open' } })
  if (open >= 3) {
    console.log(`[seed] ${open} open markets already exist, skipping`)
    return
  }
  const now = new Date()
  for (const m of SEED_BANK.slice(0, 3)) {
    await prisma.market.create({
      data: {
        category: m.category,
        question: m.question,
        description: m.description,
        resolutionCriteria: m.resolutionCriteria,
        creatorId: user.id,
        opensAt: now,
        closesAt: new Date(now.getTime() + 30 * 60 * 1000),
      },
    })
  }
  console.log('[seed] 3 open markets created')
}

async function main() {
  await seedBuiltins()
  await seedHosted()
  const user = await seedDemoUser()
  await seedMarkets(user)
  console.log('[seed] done. Run `npm run dev` and watch the agents reason.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
