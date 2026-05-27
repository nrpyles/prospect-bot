# FunnelCloser

A SaaS sister-brand to [Closer Capital](https://closercap.com). Finds local businesses with weak websites, scores them, and runs AI-personalized outreach.

## Stack
- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind v4** (CSS-first config in `globals.css`)
- **Clerk** for auth (works in keyless dev mode out of the box)
- **Drizzle ORM** + **Postgres** for data
- **Stripe** for billing (wired in Phase 5)
- **Anthropic API** for AI-drafted outreach (wired in Phase 4)

## Local development

```bash
pnpm install
pnpm dev
```

The dev server runs at http://localhost:3000.

### Environment variables

For local dev, you can mostly skip env setup:
- **Clerk** runs in keyless mode by default — it auto-provisions temporary keys. The "Configure your application" overlay on `/sign-up` lets you claim the temp instance into a real Clerk account when ready.
- **Database** — required for the dashboard. Create a Railway Postgres instance and put its URL in `.env.local` as `DATABASE_URL`.

Copy `.env.example` to `.env.local` and fill in keys as you wire each service.

### Database migrations

Once `DATABASE_URL` is set:

```bash
pnpm drizzle-kit push           # push schema directly (dev)
pnpm drizzle-kit generate       # generate migration SQL
pnpm drizzle-kit migrate        # apply migrations
```

## Project structure

```
src/
  app/
    layout.tsx                    Root layout (fonts, no auth)
    page.tsx                      Marketing landing page (/)
    (auth)/
      layout.tsx                  ClerkProvider for auth pages
      sign-in/[[...sign-in]]/     /sign-in
      sign-up/[[...sign-up]]/     /sign-up
    (app)/
      layout.tsx                  ClerkProvider + authed shell
      app/page.tsx                /app — authed dashboard (Phase 2)
  components/site/                Marketing components (Nav, Footer, Wordmark)
  db/
    schema.ts                     Drizzle schema — users, orgs, prospects, sequences, etc.
    index.ts                      DB client (lazy singleton)
  lib/cn.ts                       Tailwind className merger
  proxy.ts                        Next.js 16 proxy.ts (formerly middleware.ts) — Clerk auth
drizzle.config.ts                 Drizzle Kit config
```

## Brand

Dark theme with `#FF6B2C` orange accent — carries forward the prospect-bot DNA, refined with the avant-garde typography sensibility of [wantedfornothing.com](https://wantedfornothing.com) and the Closer family's structural confidence.

- **Display + body:** Outfit (Google Fonts)
- **Mono / numerals:** JetBrains Mono
- **Wordmark:** `FUNNEL.CLOSER` with orange accent dot

Brand tokens live in `src/app/globals.css` under `@theme`.

## Build phases

1. ✅ **Foundation** — scaffold, design system, landing, auth shell
2. ⏳ **Dashboard** — port the 6-stage Kanban pipeline + prospect CRUD
3. ⏳ **Lead-gen engine** — user-configurable Google Maps search + website scoring (TS port of `prospect-bot/prospect-finder-v2.py`)
4. ⏳ **Outreach automation** — Gmail OAuth, sequence builder, Claude-drafted personalization
5. ⏳ **Stripe billing** — DB-configurable tiers, customer portal, usage gates
6. ⏳ **Polish + deploy** — Vercel (web) + Railway (DB + worker)
