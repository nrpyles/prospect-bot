# FunnelCloser: Neal’s Private CRM

A private workspace for finding local businesses, researching their websites and SEO opportunities, and managing personal outreach. Original trades remain available alongside Christmas lighting and other seasonal services.

## What’s included

Today’s tasks, business directory, pipeline, Google business discovery, public indexed Facebook and Craigslist discovery, a listing review queue, static website and SEO checks, editable free outreach templates, optional AI drafting, personal Gmail sending, and manual reply controls.

There’s no public software sales site, subscription billing flow, client portal, or website generator in this build.

## Run it

Use Node 24 and pnpm. The original package versions are preserved.

1. Run `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env.local` and supply the owner identity, existing Clerk configuration, database URL, and stable token encryption key.
3. Back up the existing database, then apply additive migrations with `pnpm exec tsx scripts/migrate.ts`.
4. Start the web app with `pnpm dev`.
5. Start discovery in a second terminal with `pnpm worker`.
6. Open `http://localhost:3000` and sign in with the authorized owner account.

On Mac, `START_MAC.command` checks the configuration and starts both processes after dependencies are installed. It doesn’t provision a database, purchase services, or configure accounts.

## Connections

Google discovery requires a server side Places API key. Public Facebook and Craigslist discovery uses a Firecrawl API key and only covers indexed public content. Original listing links remain available for manual review. Unknown listing dates remain unknown.

For personal Gmail, configure a Google OAuth client with the redirect URL `YOUR_APP_URL/api/auth/google/callback`, then use Settings to connect your own account. The app requests sending and account identity, not inbox access. Review each email before sending. Mark replies manually to stop future due actions.

The default drafts use free local templates. AI requests occur only when you explicitly choose AI drafting and have configured an API key. Search and hosting providers may charge for usage.

## Verification

`pnpm test:unit` runs dependency free domain tests. `pnpm test:integration` requires installed dependencies and an isolated `TEST_DATABASE_URL`; database tests are skipped when it isn’t configured. `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` are required before deployment.

This build’s environment blocked dependency installation. Domain tests and TypeScript syntax checks were run; production compilation, real database migrations, OAuth, live providers, and the full browser application were not verified here. See `docs/build-validation.md` for the exact status. Do not deploy over existing production until the blocked checks pass.

Full operations, backup and rollback: `docs/private-crm-operations.md`.
