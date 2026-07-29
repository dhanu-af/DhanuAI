# Dhanu AI

## What this is

A standalone spin-off of the **"Dhanu AI"** knowledge-base assistant that lives inside the BlendCaps Operations Platform (`eagle-labs-schedule`, at `/ask-dhanu`) — pulled out into its own project, same way **Dhanu Brain** (`dev-launcher`) is its own standalone personal tool separate from Dhanu's other apps.

Rule-based (not LLM-powered) keyword/token-overlap Q&A over a knowledge base of SOPs, quality, production, formulation, and ingredient entries. Single-user, password-gated (same lightweight auth pattern as Dhanu Brain — no multi-role accounts).

**This build did not touch `eagle-labs-schedule` or `dev-launcher` in any way** — everything here is new, separate code and (once provisioned) a separate database.

## Stack

Next.js 16 App Router, Prisma 6.19 + Postgres (Neon — **its own database, not the shared BlendCaps one**), Tailwind v4, single env-var-based login (HMAC-signed session cookie, no user table).

## Structure

```
src/
  app/
    login/              — sign-in page
    ask-dhanu/           — the Ask Dhanu UI + entry-edit modal (ported from eagle-labs-schedule)
    page.tsx             — home page, renders the Ask Dhanu UI directly
  lib/
    actions/kb-actions.ts — tokenizer/scoring + CRUD server actions (ported, RBAC stripped since single-user)
    auth.ts, auth-actions.ts, session.ts — single-user login (ported from dev-launcher)
  proxy.ts               — redirects unauthenticated requests to /login
prisma/
  schema.prisma          — KnowledgeEntry, Ingredient, KbQuestionLog models + KbCategory enum
  seed.ts                — loads scripts/exported-data.json into this project's DB (upsert, safe to re-run)
scripts/
  export-from-blendcaps.ts — READ-ONLY export of real KB/Ingredient rows from the live BlendCaps DB to JSON
```

## Getting this running (not yet done)

This repo has all the code but is **not yet wired to a real database, not deployed, and has no real login credentials set** — those are the parts that need Dhanu's input:

1. Copy `.env.example` to `.env`, create a **new** Neon database (do not reuse eagle-labs-schedule's), fill in `DATABASE_URL` / `DATABASE_URL_UNPOOLED`.
2. Generate `AUTH_PASSWORD` and `AUTH_SECRET` (random strings) and set `AUTH_USERNAME`.
3. `npm install`
4. `npx prisma migrate dev --name init` to create the schema in the new DB.
5. To carry over the real KB/ingredient data from BlendCaps:
   - `BLENDCAPS_DATABASE_URL="<eagle-labs-schedule's DATABASE_URL>" npm run export:blendcaps` (read-only, writes `scripts/exported-data.json`)
   - `npm run seed` (loads that JSON into this project's own DB)
6. `npm run dev` — runs on port 3007 (`.claude/launch.json`).
7. When ready: new GitHub repo, new Vercel project, new domain (or subpath) — none of that has been created yet.

## Handover convention

Same as her other repos: `AGENTS.md` points to `HANDOVER.md` — read that first if it exists, and overwrite it at the end of each work session with that session's log.
