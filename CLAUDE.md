# CLAUDE.md — how to work in this repo

> **This supersedes the old rule in `PRD.md` that said "Claude must never write code."**
> The owner has handed Arena to Claude for autonomous build. Claude writes code, makes
> educated changes, fixes what's broken, and commits/pushes regularly. Full freedom.

## Read first
1. `THESIS.md` — why Arena exists (the bet).
2. `BRIEF.md` — what we're building (v2 spec).
3. `ARCHITECTURE.md` — how it's structured.
4. `ROADMAP.md` — live status; **keep it updated as you land work**.

## Working style
- **Commit early, commit often.** One coherent change per commit, conventional-commit style (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). Push after each meaningful unit.
- **Keep the build green.** Don't leave the repo in a non-booting state across commits.
- **Update `ROADMAP.md`** checkboxes in the same commit that lands the work.
- Prefer small, readable code that matches the surrounding style. The existing code is casual (no semicolons in places, terse). Match it; don't rewrite for taste.
- Pure logic (odds, payout, calibration) lives in `services/` and is unit-tested. Plumbing wraps it.

## Conventions
- Backend: Node 22, Express 5, CommonJS (`require`), Prisma, Zod. No TypeScript in backend.
- Frontend: React + Vite + Tailwind, ESM.
- Env: never commit `.env`. Keep `.env.example` complete. LLM features must **degrade gracefully** without `ANTHROPIC_API_KEY` so CI and keyless dev work.
- DB changes go through Prisma migrations, not manual SQL.
- Tests: `node:test` + `supertest`. Keep them fast and hermetic where possible.

## Guardrails
- No real money, ever. Credits are score.
- Don't commit secrets. Don't push broken migrations.
- The engine must never hard-crash the API process; wrap fan-out in try/catch and log.

## Commands (backend)
```bash
cd backend
npm install
npx prisma migrate dev        # apply schema
npm run seed                  # boot a live local arena
npm run dev                   # API + inline engine
npm test                      # unit + integration
```

## Quick map
- Routes: `backend/src/routes/`
- Engine: `backend/src/engine/`
- Built-in agents: `backend/src/agents/`
- Pure services (tested): `backend/src/services/`
- Frontend: `frontend/src/`
