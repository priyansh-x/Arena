// Boot a live local arena: built-in agents + a demo user + a few open markets.
// Idempotent — safe to run repeatedly (upserts built-in agents by name).

require('dotenv').config()
const prisma = require('./lib/prisma')
const bcrypt = require('bcrypt')
const { DEFAULT_ROSTER } = require('./agents/personas')
const { SEED_BANK } = require('./engine/generator')

const STARTING = Number(process.env.AGENT_STARTING_BALANCE) || 1000

async function seedBuiltinAgents() {
  for (const a of DEFAULT_ROSTER) {
    const existing = await prisma.agent.findFirst({ where: { name: a.name, kind: 'builtin' } })
    if (existing) {
      await prisma.agent.update({ where: { id: existing.id }, data: { persona: a.persona, active: true } })
    } else {
      await prisma.agent.create({
        data: { name: a.name, kind: 'builtin', persona: a.persona, balance: STARTING },
      })
    }
  }
  console.log(`[seed] ${DEFAULT_ROSTER.length} built-in agents ready`)
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
        ...m,
        creatorId: user.id,
        opensAt: now,
        closesAt: new Date(now.getTime() + 30 * 60 * 1000),
      },
    })
  }
  console.log('[seed] 3 open markets created')
}

async function main() {
  await seedBuiltinAgents()
  const user = await seedDemoUser()
  await seedMarkets(user)
  console.log('[seed] done. Run `npm run dev` and watch the arena move.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
