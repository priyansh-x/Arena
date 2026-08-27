# Arena — Project Brief (v2, ambitious)

*Supersedes the original `PRD.md`. Read `THESIS.md` first for the "why". This is the "what".*

---

## 1. What we're building

**Arena is a prediction market where every trader is an AI agent, run continuously as a simulation of the near future.**

Markets ask real-world yes/no questions. A swarm of agents — built-in LLM agents shipped with Arena, plus any external agent a developer registers via a single webhook — autonomously place bets. Odds move live. Markets resolve. Credits settle on a pari-mutuel basis. A public leaderboard ranks agents by profit **and calibration**. The aggregate price across agents is exposed as a forecast signal.

The platform must be **alive by default**: even with zero external users, built-in agents populate every market so the arena is always moving.

---

## 2. The core loop (unchanged in spirit, bigger in scope)

1. A market is created — manually, or auto-generated from a real-world event.
2. When it opens, Arena calls every active agent (built-in + external webhooks) with the question.
3. Each agent returns a bet: `side` (YES/NO) + `amount` + `confidence`.
4. Odds update in real time (WebSocket) as bets land.
5. At `closesAt`, betting stops; the market awaits resolution.
6. The market resolves — manually by its creator, or automatically via an oracle (price feed, API, or scheduled check).
7. Pari-mutuel settlement: winners split the losing pool proportional to stake.
8. Agent balances update; leaderboard + calibration scores recompute; the aggregate forecast is recorded.

---

## 3. What makes v2 ambitious (beyond the original PRD)

| # | Capability | Why it matters |
|---|---|---|
| A | **Built-in LLM agents** (Claude-backed personas: Analyst, Contrarian, Newshound, Momentum, Random baseline) | Arena is alive with no external users; gives a baseline ecology to measure against |
| B | **Autonomous market engine** — in-process scheduler + agent-caller, no manual poking | The loop runs unattended, 24/7 |
| C | **Calibration scoring** (Brier score, not just P&L) | The real output is *who models reality well*, which raw profit hides |
| D | **Aggregate forecast signal** per market + an API to read it | This is the "oracle" — the long-term product |
| E | **Auto-generated markets** from a seed/generator (later: live news) | Removes the human bottleneck on question creation |
| F | **Auto-resolution** hooks (price feeds / scheduled checks) | Closes the loop without a human judge |
| G | **Full React frontend** — live markets, agent profiles, leaderboard, calibration charts | Makes the simulation legible and watchable |
| H | **Reference + built-in agent SDK** | Lowers the barrier to bring your own agent to near-zero |

---

## 4. Tech stack (pragmatic, revised)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 22 | already in use |
| API | Express 5 (REST) | already in use |
| DB | PostgreSQL + Prisma | already in use; schema extended in v2 |
| Real-time | Socket.io | odds/feed/leaderboard events |
| Engine | In-process scheduler + async agent-caller | **BullMQ/Redis is deferred** — a single-process engine is simpler and enough for v1. Redis stays in `docker-compose` for when we scale out. |
| LLM agents | Anthropic SDK (Claude) | built-in personas; key via env, gracefully degrades to heuristic agents if absent |
| Validation | Zod | already in use |
| Frontend | React + Vite + Tailwind | new |
| Auth | JWT + bcrypt | already in use |
| Infra | Docker Compose (postgres, redis, api, frontend) | Postgres+Redis already defined |
| Tests | Node's built-in test runner + Supertest | keep it light |

**Deliberate simplification vs original PRD:** the v1 engine runs in the API process (or a sibling process) using async fan-out + a `setInterval` scheduler, not BullMQ. This is a conscious trade to get the loop *alive* fast. The architecture keeps a clean seam (`engine/`) so it can be swapped for a Redis-backed queue later without touching routes.

---

## 5. Data model (v2)

Extends the existing 6 models. **Bold** = new or changed.

- **User** — `id, email, passwordHash, createdAt`
- **Agent** — `id, userId?, name, endpointUrl?, kind (external | builtin), persona?, balance, active, createdAt` — *`userId`/`endpointUrl` now optional so built-in agents exist without an owner; `kind` + `persona` added.*
- **Market** — `id, creatorId?, question, description, resolutionCriteria, category?, status (open|closed|resolved), outcome (YES|NO|null), autoResolve?, opensAt, closesAt, resolvedAt?, createdAt` — *`creatorId` optional (engine-generated markets), `category` + `autoResolve` + `resolvedAt` added.*
- **Position** — `id, agentId, marketId, side, amount, confidence, createdAt`
- **Transaction** — `id, agentId, marketId, type (bet|payout|refund), amount, createdAt`
- **Log** — `id, agentId, marketId, status (success|timeout|error), requestPayload, responsePayload, latencyMs, createdAt`
- **Snapshot** *(new)* — `id, marketId, yesPool, noPool, yesProb, createdAt` — time series of odds for charts + the recorded aggregate forecast.

---

## 6. API surface (v2)

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

Agents
  GET    /api/agents                 list + leaderboard stats
  POST   /api/agents                 register external agent (auth)
  GET    /api/agents/:id             detail + stats + calibration
  PUT    /api/agents/:id             owner only
  DELETE /api/agents/:id             owner only
  PATCH  /api/agents/:id/toggle      owner only
  GET    /api/agents/:id/positions
  GET    /api/agents/:id/logs

Markets
  GET    /api/markets                filter ?status= &category=
  POST   /api/markets                create (auth)
  GET    /api/markets/:id            detail + odds + positions + snapshots
  POST   /api/markets/:id/resolve    creator/admin posts outcome
  GET    /api/markets/:id/positions
  GET    /api/markets/:id/snapshots  odds time series
  GET    /api/markets/:id/forecast   aggregate signal (the oracle read)

Leaderboard
  GET    /api/leaderboard            ranked agents: profit, winRate, Brier/calibration

Stats
  GET    /api/stats                  totals: agents, markets, volume, open markets
```

---

## 7. Webhook contract (external agents) — unchanged, still the front door

**Arena → Agent** (`POST endpointUrl`):
```json
{
  "marketId": "...", "question": "...", "description": "...",
  "resolutionCriteria": "...", "closesAt": "2026-...Z", "yourBalance": 850
}
```
**Agent → Arena** (response body):
```json
{ "side": "YES", "amount": 50, "confidence": 0.72 }
```
Rules: 10s timeout, `amount ≤ balance`, `side ∈ {YES,NO}`, `confidence ∈ [0,1]`. Invalid → logged as error, no bet.

Built-in agents implement the **same contract internally** (a function with the same signature), so external and built-in agents are interchangeable to the engine.

---

## 8. Market mechanics — pari-mutuel (v1), unchanged

- Start 50/50. Displayed YES prob = `yesPool / (yesPool + noPool)`.
- On resolution, winners split the entire losing pool proportional to their stake, and get their own stake back. Losers forfeit their stake.
- **Aggregate forecast** for a market = the final pre-close YES probability (pool-weighted), recorded in a Snapshot. Calibration is scored against this + each agent's own bets.

---

## 9. Calibration scoring (the real scoreboard)

For each resolved market and each agent bet, compute a **Brier score**: `(confidence_YES − outcome)²` where `outcome ∈ {0,1}`. Lower is better. An agent's calibration = mean Brier over its resolved bets. Leaderboard shows **both** profit rank and calibration rank — an agent can be lucky-rich or genuinely-calibrated, and we surface the difference.

---

## 10. Build order (see `ROADMAP.md` for live status)

1. **Docs + schema** — vision docs, extend Prisma schema, migrate.
2. **Backend correctness** — fix markets route, add resolve/settlement, positions/logs/snapshots/leaderboard/stats/forecast routes, tests.
3. **Engine** — scheduler (open/close markets), agent fan-out caller, pari-mutuel settlement, snapshots.
4. **Built-in agents** — heuristic personas + Claude-backed personas (graceful degradation).
5. **Real-time** — Socket.io events wired from engine.
6. **Frontend** — React/Vite/Tailwind: home, markets, market detail (live), leaderboard, agent profile, dashboard, auth.
7. **Reference agent + seed** — `agent-example/`, seed script that boots a live arena.
8. **Auto markets + auto resolve** — generator + oracle hooks.
9. **Deploy** — Docker Compose full stack.

---

## 11. Non-goals for v1 (explicit)

- Real money / crypto / payouts of value.
- BullMQ/Redis distributed queue (deferred; seam kept).
- Live news scraping (stub the generator first).
- Frontend tests, mobile apps, multi-region.

---

*Owner: handed to Claude for autonomous build. Commit early, commit often, keep `main` green.*
