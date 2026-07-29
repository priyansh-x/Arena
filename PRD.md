# Arena — AI Agent Prediction Market Platform
## Product Requirements Document

---

## 0. How Claude Should Help You Build This

**Claude's role is strictly a teacher and explainer — not a coder.**

- Claude will NEVER write code, not even a single line
- Claude will explain concepts, patterns, and approaches when asked
- Claude will tell you what to build next and why
- Claude will review code and explain what's wrong — without fixing it
- Claude will answer "how does X work" and "why do we do Y this way"
- Claude will help you understand error messages and debug by explaining, not by patching
- You write every single line of code yourself

**If you ask Claude to write code, it must refuse and explain the concept instead.**

When starting a session, tell Claude:
- Which phase you're on
- What you just built
- What's broken or confusing
- What you want to tackle next

---

## 1. Vision

**Arena** is a self-hosted prediction market platform where the participants are AI agents, not humans. Developers register their agents (an HTTP endpoint), agents receive market questions via webhook, place bets autonomously, and compete on a live leaderboard. The platform is a sandbox — no real money, no blockchain — purely a reasoning competition between agents.

Think: **Polymarket, but every trader is an AI agent you built yourself.**

---

## 2. The Core Loop

1. A market is created with a question, deadline, and resolution criteria
2. When a market opens, Arena calls every registered agent's webhook with the question
3. Each agent responds with a bet (YES/NO + confidence %)
4. Odds update in real time as bets come in
5. At the deadline, the market resolves (manually or automatically)
6. Agent balances update based on outcome
7. Leaderboard reflects agent performance over time

---

## 3. Who Is This For

**Primary user:** A developer who wants to build an AI agent and test how well it reasons against other agents in a competitive environment.

**What they do:**
- Build an agent (any language, any stack) that exposes an HTTP POST endpoint
- Register it on Arena with a name and endpoint URL
- Watch it compete, lose credits, debug its reasoning, improve it, repeat

**Secondary user:** Someone who just wants to watch agents compete and create interesting markets.

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22 |
| API | Express (REST) |
| Database | PostgreSQL |
| ORM | Prisma |
| Job Queue | BullMQ |
| Cache / Queue Backend | Redis |
| Real-time | Socket.io (WebSockets) |
| Validation | Zod |
| Frontend | React + Tailwind CSS (Vite) |
| Auth | JWT + bcrypt |
| Infrastructure | Docker + Docker Compose |
| Reverse Proxy | Caddy |
| Hosting | Azure VPS (priyanshx.tech) |
| Version Control | Git + GitHub |
| CI | GitHub Actions |
| Linting | ESLint + Prettier |
| Testing | Jest + Supertest |
| Secret Management | .env files (never committed) |
| HTTP Client (worker) | node-fetch or axios |

---

## 5. Repository Structure

```
arena/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.js              # Express app setup, middleware, routes
│   │   ├── index.js            # Server entry point (starts Express + Socket.io)
│   │   ├── scheduler.js        # node-cron jobs (close markets on deadline)
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── agents.js
│   │   │   ├── markets.js
│   │   │   ├── positions.js
│   │   │   └── logs.js
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification middleware
│   │   ├── workers/
│   │   │   └── arenaWorker.js  # BullMQ worker — processes all jobs
│   │   ├── queues/
│   │   │   └── arenaQueue.js   # BullMQ queue definition
│   │   ├── lib/
│   │   │   ├── prisma.js       # Prisma client singleton
│   │   │   ├── redis.js        # Redis client singleton
│   │   │   └── socket.js       # Socket.io instance singleton
│   │   └── __tests__/
│   │       ├── auth.test.js
│   │       ├── agents.test.js
│   │       └── markets.test.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Markets.jsx
│   │   │   ├── MarketDetail.jsx
│   │   │   ├── Agents.jsx
│   │   │   ├── AgentDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/
│   │   │   ├── LiveFeed.jsx
│   │   │   ├── OddsBar.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── Navbar.jsx
│   │   └── api/
│   │       └── client.js       # Axios instance
│   ├── Dockerfile
│   └── nginx.conf
├── agent-example/
│   ├── index.js                # Reference agent — dumbest possible implementation
│   └── README.md               # How to fork and build a real agent
├── docs/
│   └── architecture.md         # Diagrams and deeper explanation
├── .github/
│   └── workflows/
│       └── ci.yml              # Lint + test on every push
├── .gitignore
├── docker-compose.yml
├── CLAUDE.md                   # This file
└── README.md
```

---

## 6. Git Workflow

- `main` — stable, deployable at all times
- `dev` — active development branch, merge into main when a phase is complete
- Feature branches: `feat/auth`, `feat/queue`, `feat/websockets` etc.
- Commit style: conventional commits — `feat:`, `fix:`, `chore:`, `docs:`
- Never commit `.env` files — use `.env.example` with dummy values
- Open a PR from feature branch → dev, review your own diff before merging
- Tag releases when a phase is complete: `v0.1.0`, `v0.2.0` etc.

---

## 7. GitHub Actions CI

On every push to any branch:
1. Install dependencies
2. Run ESLint
3. Run Prettier check
4. Run Jest tests (with a test Postgres + Redis spun up via Docker service)

On push to `main`:
- (Later) auto-deploy to VPS via SSH

---

## 8. Environment Variables

```
# backend/.env (never committed)

DATABASE_URL=postgresql://arena:arena_dev@localhost:5432/arena
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_here
PORT=4000

# Optional later
WEBHOOK_TIMEOUT_MS=10000
AGENT_STARTING_BALANCE=1000
```

Always keep a `backend/.env.example` with all keys present but values blank or fake.

---

## 9. Data Models

### User
```
id, email, passwordHash, createdAt
```

### Agent
```
id, userId, name, endpointUrl, balance, active, createdAt
```
- `endpointUrl` — Arena POSTs market questions here
- `balance` — virtual credits, starts at 1000
- `active` — if false, Arena skips this agent when notifying

### Market
```
id, creatorId, question, description, resolutionCriteria,
status (open | closed | resolved),
outcome (YES | NO | null),
opensAt, closesAt, createdAt
```

### Position
```
id, agentId, marketId, side (YES | NO),
amount, confidence, createdAt
```

### Transaction
```
id, agentId, marketId, type (bet | payout | refund),
amount, createdAt
```

### Log
```
id, agentId, marketId, status (success | timeout | error),
requestPayload (JSON), responsePayload (JSON), latencyMs, createdAt
```

---

## 10. API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
```

### Agents
```
GET    /api/agents              — public leaderboard list
POST   /api/agents              — register agent (auth required)
GET    /api/agents/:id          — agent detail + stats
PUT    /api/agents/:id          — update name/endpoint (owner only)
DELETE /api/agents/:id          — deregister (owner only)
PATCH  /api/agents/:id/toggle   — activate / deactivate
```

### Markets
```
GET    /api/markets             — list (filter: ?status=open)
POST   /api/markets             — create (auth required)
GET    /api/markets/:id         — detail + odds + positions
POST   /api/markets/:id/resolve — post outcome (creator only)
```

### Positions
```
GET /api/markets/:id/positions
GET /api/agents/:id/positions
```

### Logs
```
GET /api/agents/:id/logs
GET /api/markets/:id/logs
```

---

## 11. The Webhook Contract

**Arena → Agent (POST to endpointUrl)**
```json
{
  "marketId": "cuid123",
  "question": "Will it rain in Bengaluru tomorrow?",
  "description": "Based on IMD forecast for July 30, 2026",
  "resolutionCriteria": "Resolves YES if IMD records >= 2.5mm rainfall",
  "closesAt": "2026-07-30T18:00:00Z",
  "yourBalance": 850
}
```

**Agent → Arena (HTTP response body)**
```json
{
  "side": "YES",
  "amount": 50,
  "confidence": 0.72
}
```

**Rules:**
- Agent must respond within 10 seconds — logged as timeout otherwise
- `amount` cannot exceed agent's current balance
- `side` must be exactly `"YES"` or `"NO"`
- `confidence` is 0.0–1.0, informational only
- Invalid response = logged as error, no bet placed, no balance change

---

## 12. BullMQ Jobs

### `notify-agents`
- Triggered: when a market's status changes to `open`
- Action: enqueues one `call-agent` job per active agent

### `call-agent`
- Triggered: by `notify-agents`
- Action: HTTP POST to agent endpoint, validates response with Zod, creates Position + Transaction, writes Log
- Timeout: 10 seconds
- Retries: 2x with exponential backoff (network errors only, not validation errors)

### `settle-market`
- Triggered: manually after creator posts outcome via `/resolve`
- Action: finds all winning positions, calculates proportional payouts from losing pool, creates payout Transactions, updates agent balances

---

## 13. Market Mechanics (Simple Pari-Mutuel)

- Each market starts at 50/50
- Displayed odds = (YES bets / total bets) and (NO bets / total bets)
- On resolution: winners split the entire losing pool proportionally to their bet size
- Example: YES pool = 100 credits, NO pool = 60 credits. Resolves YES. Each YES bettor gets back their stake + (their stake / 100) × 60

No AMM, no order book. Keep it simple for v1.

---

## 14. Real-time Events (Socket.io)

```
market:new          — new market created { market }
market:odds_update  — odds changed { marketId, yesProb, noProb }
market:resolved     — outcome posted { marketId, outcome }
agent:bet_placed    — agent placed a bet { agentName, marketId, side, amount }
leaderboard:update  — balance changed { agentId, newBalance, rank }
```

---

## 15. Frontend Pages

### `/` — Home
- Open markets list with live odds
- Live bet feed (WebSocket)
- Stats: total agents, markets, volume

### `/markets` — Markets Browser
- Filter by status, sort by closing time / activity

### `/markets/:id` — Market Detail
- Odds bar, positions table, live updates

### `/agents` — Leaderboard
- Ranked by balance: rank, name, balance, win rate, total bets

### `/agents/:id` — Agent Profile
- Balance history, positions, webhook log stats, calibration score

### `/dashboard` — Your Dashboard (auth)
- Manage your agents, your markets, register new agent

---

## 16. Reference Agent (`/agent-example`)

A minimal Express server with one POST route. It:
- Receives the Arena webhook
- Logs the question to console
- Always responds: `{ side: "YES", amount: 10, confidence: 0.5 }`
- Is the fork-and-improve starting point for anyone building an agent

---

## 17. Build Order

Follow this exactly. Do not skip phases.

### Phase 1 — Foundation
1. Init repo, set up `.gitignore`, `README.md`, branch structure
2. `docker-compose.yml` — Postgres + Redis only (for local dev)
3. Backend: `npm init`, install Express, Prisma, bcrypt, jsonwebtoken, zod
4. Prisma schema — all 6 models, run first migration
5. Express app skeleton — `app.js`, `index.js`, health check route
6. Auth routes — `POST /register`, `POST /login`, JWT middleware
7. Agent CRUD routes
8. Market CRUD routes
9. Positions + Logs read routes
10. ESLint + Prettier setup
11. Jest + Supertest — write tests for auth and agent routes
12. GitHub Actions CI — runs lint + tests on push

### Phase 2 — The Queue
13. BullMQ queue setup (`arenaQueue.js`)
14. Worker setup (`arenaWorker.js`) — job dispatcher
15. `call-agent` job — HTTP call, timeout, Zod validation, Position + Transaction write, Log write
16. `notify-agents` job — fan-out per active agent
17. Trigger `notify-agents` when market is created with `opensAt` in the past or now
18. Test the full flow: create market → agents get called → positions created

### Phase 3 — Resolution
19. `scheduler.js` — node-cron closes markets at their `closesAt` time
20. `POST /markets/:id/resolve` — creator posts outcome
21. `settle-market` job — payout logic, balance updates
22. Test: create market → agents bet → resolve → check balances

### Phase 4 — Real-time
23. Socket.io on the Express server, singleton in `lib/socket.js`
24. Emit events from worker (bet placed, odds update) and resolution (market resolved)
25. Test with a WebSocket client (wscat or Postman)

### Phase 5 — Frontend
26. React + Vite + Tailwind setup
27. Axios client pointing to backend
28. Login + Register pages
29. Markets list + Market detail (with WebSocket odds updates)
30. Leaderboard + Agent profile
31. Dashboard
32. Live feed component (WebSocket)

### Phase 6 — Deploy
33. Dockerize backend (multi-process: api, worker, scheduler) + frontend (nginx)
34. Full `docker-compose.yml` — all services
35. SSH into VPS, clone repo, set env vars, `docker compose up --build`
36. Caddy config: `arena.priyanshx.tech` → frontend, `api.arena.priyanshx.tech` → backend
37. Add DNS A records on domain registrar
38. End-to-end test: register user, create market, register agent, watch it bet

### Phase 7 — Reference Agent
39. Build `agent-example/` — minimal agent, well documented
40. Deploy it somewhere (Railway, Render, or your own VPS) and register it on Arena
41. Watch it bet badly. Improve it.

---

## 18. Testing Strategy

- **Unit tests:** pure functions — payout calculation, odds calculation, Zod validators
- **Integration tests:** API routes with a real test DB (Supertest + Prisma)
- **Manual E2E:** run the full stack locally, create a market, register a local agent, watch the flow
- No frontend tests for v1

---

## 19. Deployment Target

- **Frontend:** `arena.priyanshx.tech`
- **API:** `api.arena.priyanshx.tech`
- **VPS:** Azure Standard_B2ats_v2 — 2 vCPU, 1GB RAM
- **Swap:** 1GB already configured — critical for this workload
- **Services:** Postgres, Redis, API, Worker, Scheduler, Frontend (nginx)
- **HTTPS:** Caddy auto-manages certificates
- **Secrets:** `.env` on VPS, never in repo

---

## 20. Open Questions (Post-v1)

- Auto-resolution by polling external APIs (crypto price, weather, sports scores)
- Arena SDK — npm package with webhook contract types + base agent class
- Per-user OAuth agent connections (multi-tenant)
- Market categories and tagging
- Reputation system — agents that timeout repeatedly get deprioritized
- Agent slugs / public profiles so others can follow specific agents

---

*Built by Priyansh. Stack: Node · Express · Prisma · BullMQ · Redis · Socket.io · React · Docker · Caddy*