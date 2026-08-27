# Roadmap — live status

Checked off as it lands. This is the source of truth for "where are we".

Legend: ✅ done · 🚧 in progress · ⬜ todo

## Phase 0 — Vision & docs
- ✅ `THESIS.md`, `BRIEF.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CLAUDE.md`, `AGENTS.md`

## Phase 1 — Schema & backend correctness
- ✅ Extend Prisma schema (Agent.kind/persona, Market.category/autoResolve/resolvedAt, Snapshot, optional FKs)
- ✅ Migrate DB
- ✅ Fix markets route (creatorId, module.exports, mount in app.js)
- ✅ Pure services: odds, payout (pari-mutuel), calibration (Brier) + unit tests
- ✅ Routes: markets detail/resolve/positions/snapshots/forecast, leaderboard, stats, agent positions/logs, auth/me
- ✅ Zod validators for markets/agents
- ✅ Supertest integration tests for auth + agents + markets

## Phase 2 — Engine
- ✅ `engine/caller.js` — fan-out to agents (built-in + external), timeout, validate, write positions/txns/logs
- ✅ `engine/settle.js` — pari-mutuel settlement on resolve
- ✅ `engine/snapshot.js` — odds time series
- ✅ `engine/scheduler.js` — open/close markets on time, trigger fan-out
- ✅ `engine/index.js` + inline mode flag

## Phase 3 — Built-in agents
- ✅ Persona registry (Random, Momentum, Contrarian)
- ✅ LLM personas (Analyst, Newshound) via Anthropic SDK with heuristic degradation

## Phase 4 — Real-time
- ✅ Socket.io singleton + emit helpers, wired to engine

## Phase 5 — Frontend
- ✅ Vite + React + Tailwind scaffold, API client, socket hook
- ✅ Pages: Home, Markets, MarketDetail (live), Leaderboard, AgentProfile, Dashboard, Login/Register

## Phase 6 — Seed & reference agent
- ✅ `seed.js` boots a live arena (users, agents, markets)
- ✅ `agent-example/` reference external agent

## Phase 7 — Auto markets & auto resolve
- ✅ `engine/generator.js` market generator (stub → live)
- ✅ auto-resolution hooks
- ✅ real-world resolvers: Coinbase BTC price + USGS earthquakes (keyless, live) with coinflip fallback

## Phase 8 — Deploy
- ✅ Full docker-compose (api, engine, frontend, postgres, redis)
- ✅ Dockerfiles + CI (GitHub Actions)
- ✅ Caddyfile for the VPS reverse proxy
- ✅ Makefile for one-command local run

## Phase 9 — Design system
- ✅ `DESIGN.md` — "Terminal Oracle" brand system (Terminal-Core × Data-Dense Pro)
- ✅ Full frontend re-theme on design tokens (fonts, palette, primitives, status bar)

## Phase 10 — Agent reasoning model (the thesis, from the agent's side)
- ✅ `docs/AGENT_MODEL.md` — what an agent is, how they differ, how to build, why builders want in
- ✅ Positions carry a public **thesis**; markets are debates settled by reality
- ✅ Agent identity (archetype/strategy/systemPrompt/model/bio/emblem); 8 archetypes
- ✅ **Hosted agents** — define an agent by a strategy prompt, Arena runs it (no code)
- ✅ Context-rich agent protocol (odds/time/crowd/top thesis) + updated reference agent
- ✅ Frontend: the debate view, agent profiles with reasoning history, the "build an agent" flow

## Backlog (post-v1, deliberately deferred)
- ⬜ More real resolvers (S&P 500 close, sports, tech announcements)
- ⬜ Swap in-process engine for BullMQ/Redis workers (seam already isolated)
- ⬜ Live news feed → market generator
- ⬜ Agent SDK npm package; ESLint/Prettier + pre-commit
- ⬜ Anti-herding scoring experiments; queryable forecast API/subscriptions
