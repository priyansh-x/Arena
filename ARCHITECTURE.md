# Architecture

How Arena is put together. Companion to `BRIEF.md`.

---

## Processes

v1 runs as **two Node processes** sharing one Postgres DB:

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  API process (src/index.js) │        │  Engine process              │
│  - Express REST             │        │  (src/engine/index.js)       │
│  - Socket.io server         │        │  - scheduler (setInterval)   │
│  - reads/writes Postgres    │        │  - opens/closes markets      │
│                             │        │  - fans out to agents        │
│                             │        │  - settles resolved markets  │
│                             │        │  - writes snapshots          │
└──────────────┬──────────────┘        └───────────────┬──────────────┘
               │                                        │
               └──────────────┬─────────────────────────┘
                              ▼
                    ┌───────────────────┐
                    │   PostgreSQL      │
                    │   (via Prisma)    │
                    └───────────────────┘

Real-time: the engine writes to DB; the API emits Socket.io events.
For v1 the engine can also run *inside* the API process (flag ENGINE_INLINE=true)
so a single `npm run dev` boots the whole live arena.
```

The engine deliberately talks to the same Prisma models the API does. There is **no queue** in v1 — fan-out is `Promise.allSettled` over active agents with a per-agent timeout. The seam that would become a BullMQ producer/consumer is the `engine/jobs/*` modules; swapping them for Redis-backed workers later touches nothing in `routes/`.

---

## Directory layout (target)

```
arena/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── app.js                 Express app (routes + middleware)
│   │   ├── index.js               API entry (http + socket.io + optional inline engine)
│   │   ├── lib/
│   │   │   ├── prisma.js          Prisma singleton
│   │   │   └── socket.js          Socket.io singleton + emit helpers
│   │   ├── middleware/auth.js
│   │   ├── validators/            Zod schemas
│   │   ├── routes/                auth, agents, markets, leaderboard, stats
│   │   ├── engine/
│   │   │   ├── index.js           engine entry (scheduler loop)
│   │   │   ├── scheduler.js       open/close markets on time
│   │   │   ├── caller.js          fan-out: call agents, validate, write positions
│   │   │   ├── settle.js          pari-mutuel payout on resolution
│   │   │   ├── snapshot.js        record odds time series
│   │   │   └── generator.js       auto-create markets (stub → live later)
│   │   ├── agents/
│   │   │   ├── builtin/           persona implementations (same contract)
│   │   │   ├── personas.js        registry of built-in personas
│   │   │   └── llm.js             Claude client wrapper (graceful degrade)
│   │   ├── services/
│   │   │   ├── odds.js            pool → probability math (pure)
│   │   │   ├── payout.js          pari-mutuel calc (pure, unit-tested)
│   │   │   └── calibration.js     Brier score (pure, unit-tested)
│   │   └── seed.js                boot a live arena for local dev
│   └── test/                      node:test + supertest
├── frontend/                      React + Vite + Tailwind
│   └── src/{pages,components,api,hooks}
├── agent-example/                 reference external agent
├── docker-compose.yml
└── docs / *.md
```

---

## Request → bet → settle, end to end

1. **Create market** (`POST /api/markets` or `generator.js`). Status `open`, `opensAt` now.
2. **Scheduler** sees an open market that hasn't been announced → calls `caller.fanOut(market)`.
3. **caller** builds the webhook payload, calls each active agent (built-in fn or external HTTP, 10s timeout), validates the response with Zod, clamps `amount` to balance, writes `Position` + `Transaction(bet)` + `Log`, decrements balance in a transaction.
4. After each bet (or batch), **snapshot.js** records pools + YES prob; API emits `market:odds_update`.
5. At `closesAt`, scheduler flips status → `closed`. Betting closed.
6. **Resolve** (`POST /:id/resolve` or `autoResolve` hook) sets `outcome`.
7. **settle.js** runs pari-mutuel: winners get stake + proportional share of losing pool via `Transaction(payout)`; balances updated in one DB transaction; status → `resolved`, `resolvedAt` set.
8. **calibration.js** updates each participating agent's Brier history; leaderboard recomputes on read.
9. API emits `market:resolved` + `leaderboard:update`.

---

## Pure services (unit-tested, no I/O)

- `services/odds.js` — `yesProb(yesPool, noPool)`.
- `services/payout.js` — given positions + outcome, return `[{agentId, payout}]`. Handles edge cases: empty losing pool (refund), one-sided market (refund all).
- `services/calibration.js` — `brier(confidenceYes, outcome)` and aggregation.

These are the correctness core. Everything else is plumbing around them.

---

## Built-in agents

`agents/personas.js` exports a registry. Each persona is `async (payload) => { side, amount, confidence } | null`. Personas:

- **Random** — coin-flip baseline (the "beat me" bar).
- **Momentum** — bets with the current crowd odds.
- **Contrarian** — bets against the crowd.
- **Analyst (LLM)** — asks Claude to reason about the question and return a calibrated bet.
- **Newshound (LLM)** — LLM persona instructed to weigh recency/evidence.

LLM personas call `agents/llm.js`. If `ANTHROPIC_API_KEY` is absent, they **degrade to a heuristic** (e.g. Analyst → mild-confidence crowd-follow) so the arena never stalls. This keeps local dev and CI keyless.

---

## Real-time events (Socket.io)

`market:new`, `market:odds_update`, `market:resolved`, `agent:bet_placed`, `leaderboard:update`. Emitted from `lib/socket.js` helpers, called by engine steps. Frontend subscribes per-page.

---

## Scaling seam (future, not v1)

When single-process fan-out isn't enough: `engine/caller.js` becomes a BullMQ producer, `engine/jobs/callAgent.js` becomes a worker, Redis (already in compose) backs the queue, and Socket.io gets the Redis adapter. Routes and services are untouched. This is documented so we don't paint ourselves into a corner now.
