# Private Prospecting CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Redesign Neal's existing application into his private CRM for discovering businesses and selling website and SEO improvements.

**Architecture:** Preserve existing records, pipeline stages, authentication, and Gmail connection. Add independently testable discovery adapters, durable search jobs, bounded website research, and a redesigned CRM shell. All real provider requests run on the server; incomplete research stays visibly incomplete.

**Tech Stack:** Existing Next.js 16.2.6, React 19.2.4, TypeScript, Tailwind v4, Clerk, Postgres, Drizzle, Cheerio, Zod, native fetch, Node test runner with existing tsx. Do not add a second frontend framework or new queue service.

**Spec:** docs/superpowers/specs/2026-10-19-seasonal-website-outreach-design.md

## Global Constraints

1. This is Neal's private tool for finding businesses and managing his own outreach.
2. The commercial offer is building or improving a business website and helping improve SEO.
3. Retain original business categories and add Christmas lighting and other seasonal trades.
4. Discovery should cover Google, public Facebook results, and public Craigslist listings.
5. Outreach should use Neal's personally connected email.
6. A public marketing site, pricing page, subscription billing, customer registration flow, website generator, preview hosting, and client portal are outside this build.
7. Keep existing prospect, sequence, lending, and contractor records.
8. No actual prospect outreach or active campaign during implementation or tests.
9. Write user facing copy with contractions and without dash punctuation or the words Neal excludes.
10. Read AGENTS.md and installed version specific Next.js guides before editing framework code. Preserve the lockfile unless a verified dependency need requires an update.

## Review Focus

1. Businesses sharing a name across cities remain separate unless independent identity evidence matches.
2. Old social results, blocked pages, and homeowner requests are not represented as verified current business leads.
3. Redirects, DNS changes, IPv6, and oversized website responses cannot turn research into unrestricted server fetching.
4. Double clicks, disconnected or changed senders, and accepted mail followed by logging failure do not generate duplicate email.
5. Existing rows with null research fields and stopped or already completed enrollments survive migration and retain correct next actions.

## File and Interface Map

Existing boundary files: src/db/schema.ts and src/db/prospects.ts for storage; src/lib/pipeline.ts for original categories and stages; src/lib/lead-search.ts and src/lib/google-maps.ts for discovery; src/lib/scoring.ts for website checks; src/lib/ai-drafter.ts for copy; src/db/sequences.ts for follow ups; src/app/api/gmail/send/route.ts for sending.

New modules:
1. src/lib/crm-types.ts: shared prospect research, evidence, offer, and discovery contracts.
2. src/lib/seasonal-trades.ts: query synonyms and seasonal presets.
3. src/lib/private-access.ts: owner authorization policy.
4. src/lib/research/safe-fetch.ts and website-audit.ts: bounded fetching and factual checks.
5. src/lib/discovery/types.ts, google.ts, public-web.ts, normalize.ts: provider boundaries and review decisions.
6. src/db/discovery.ts and src/lib/discovery/worker.ts: persistent jobs and resumable work.
7. src/db/research.ts: findings and candidate review persistence.
8. src/lib/outreach/agency-draft.ts and send-service.ts: evidence based copy and send state machine.
9. src/components/crm/: private shell, search composer, prospect research, tasks, and sender controls.
10. tests/unit, tests/integration, tests/e2e: contract, database, and browser checks. Test fixture domains use example.com and reserved test names; real businesses never receive test traffic.

Primary contracts, defined once in the modules that own them:
- DiscoverySource = "google" | "facebook" | "craigslist".
- WebsiteState = "missing" | "inspected" | "unavailable" | "unchecked".
- OfferType = "website_build" | "website_refresh" | "seo_improvements" | "website_plus_seo".
- Evidence = { id, source, url, query, observedAt, publishedAt: string | null, verifiedAt: string | null, freshness: "unknown" | "current" | "stale" | "unavailable", snippet, verifiedFields: string[] }.
- Finding = { id, category: "website" | "on_page_seo" | "local_visibility", code, title, evidence, url, checkedAt, confidence: "observed" | "needs_review", suggestion }.
- Candidate = { id, displayTitle, businessName: string | null, city, industry, website: string | null, phone: string | null, email: string | null, placeId: string | null, providerStatus: "provider" | "homeowner_request" | "unknown", evidence: Evidence[], reviewRequired: boolean }.
- AuditResult = { state: WebsiteState, findings: Finding[], checksRun: string[], checksNotRun: string[], errorCode?: string }.
- SearchJobConfig = { cities: string[], industries: Industry[], sources: DiscoverySource[], qualityFilter: Quality[] | null, maxResultsPerQuery: number, maxCandidates: number, maxUnits: number }.
- SendIntentState = "prepared" | "sending" | "sent" | "unknown" | "failed" | "cancelled".

## Task 1: Additive CRM storage and test harness

**Files:** Modify package.json, src/db/schema.ts, src/db/prospects.ts, src/lib/mock-prospects.ts; create src/lib/crm-types.ts, src/db/research.ts, tests/integration/migrations.test.ts; generate the next Drizzle migration and metadata.

**Interfaces:** Define Evidence, Finding, WebsiteState, and OfferType. Preserve current UI Prospect fields and add researchState, offerType, nextAction, externalProjectUrl as optional fields. Keep the existing quality enum intact; Unknown is a UI research state rather than a destructive enum change.

- [ ] Write migration tests: seed legacy prospects with null quality, old statuses, dates, notes, and enrollment records; migrate; assert every original ID and original value survives; new defaults are unchecked rather than missing.
- [ ] Add test:unit using node --import tsx --test tests/unit/*.test.ts and test:integration using the same runner over tests/integration/*.test.ts. Database tests use TEST_DATABASE_URL and an isolated schema, never DATABASE_URL; missing test database is reported as not run, not as passed.
- [ ] Add prospect fields, candidate/evidence/findings tables, search job/unit tables, and send intent tables with organization scoping, timestamps, indexes, and unique source URL constraints scoped to prospect. Implement saveFindings(orgId, prospectId, audit: AuditResult): Promise<void> and listFindings(orgId, prospectId): Promise<Finding[]>.
- [ ] Run the migration tests against a disposable Postgres database. Check cross organization access returns no rows and repeated migration execution retains records.
- [ ] Commit: feat: add private CRM research and job storage.

## Task 2: Private application access

**Files:** Modify src/app/page.tsx, src/proxy.ts, src/lib/server-context.ts, src/app/(auth)/sign-in/[[...sign-in]]/page.tsx, src/app/(auth)/sign-up/[[...sign-up]]/page.tsx, src/app/(app)/app/page.tsx; create src/lib/private-access.ts, tests/unit/private-access.test.ts.

**Interfaces:** isAllowedOwner({clerkId, verifiedEmail}, {ownerClerkId?, ownerEmail?}): boolean. Require PRIVATE_OWNER_CLERK_ID or PRIVATE_OWNER_EMAIL; fail closed when neither is configured. Do not use an unverified email for authorization.

- [ ] Write failing assertions for exact owner access, normalized verified owner email, unrelated account denial, unverified email denial, and absent owner configuration denial.
- [ ] Run node --import tsx --test tests/unit/private-access.test.ts; confirm failures are implementation failures.
- [ ] Gate getUserContext before ensureUserAndOrg. Redirect root to /app and closed registration to sign in. Remove the dashboard's seed organization fallback. Remove public marketing content from the active route; retain legacy data tables.
- [ ] Rerun access tests. Verify authenticated APIs and server actions all pass through the owner gate; a denied account must never create a workspace.
- [ ] Commit: feat: make the CRM owner only.

## Task 3: Original and seasonal trade catalog

**Files:** Modify src/lib/pipeline.ts, src/lib/lead-search.ts, src/lib/research-links.ts; create src/lib/seasonal-trades.ts, tests/unit/seasonal-trades.test.ts.

**Interfaces:** SEARCH_PRESETS and getIndustryQueries(industry: Industry): string[]. Add exactly the nine seasonal categories in the spec. Existing categories and statuses remain available.

- [ ] Write assertions that every existing industry still exists, nine seasonal entries are distinct, fall preset includes Christmas Light Installation and Gutter Cleaning, winter preset includes Snow and Ice Removal, and Christmas queries include both Christmas lighting and holiday light installation synonyms.
- [ ] Run the catalog test and confirm failure.
- [ ] Implement presets and query mapping. Extend source labels for public Facebook and Craigslist. Preserve existing Google research links and add encoded regional Craigslist links. Store source URLs separately from standalone websites.
- [ ] Rerun the catalog tests, including a location containing punctuation.
- [ ] Commit: feat: add seasonal trades without losing original categories.

## Task 4: Safe website research and SEO findings

**Files:** Create src/lib/research/safe-fetch.ts, src/lib/research/website-audit.ts, tests/unit/safe-fetch.test.ts, tests/unit/website-audit.test.ts; modify src/lib/scoring.ts.

**Interfaces:** safeFetchPage(url: string, options?: {signal?: AbortSignal}): Promise<{url, html, status}>; inspectWebsite(url: string | null): Promise<AuditResult>. Use controlled address resolution and connection pinning for every redirect; reject nonpublic IPv4 and IPv6, credentials in URLs, nonhttp schemes, and ports other than 80/443. Limits: 10 second total timeout, 3 redirects, 1 MiB HTML body, 5 pages and 20 internal links per bounded audit.

- [ ] Write assertions: missing URL gives missing; timeout or blocked request gives unavailable; valid HTML finds missing title, meta description, H1, contact path, and viewport without inventing traffic or rankings. noindex is a page finding, not a domain claim. A canonical URL or structured data cannot create a ranking guarantee.
- [ ] Add safe fetch tests for private IPv4/IPv6, IPv4 mapped IPv6, public redirect to private destination, rebinding response, oversized stream, and a slow response after redirect. Run both tests and confirm failure.
- [ ] Implement fetching through the safe boundary, HTML checks with Cheerio, explicit unrun checks, and bounded same origin link checks. Give unavailable results no poor quality grade. Remove builder brand and copyright as decisive penalties.
- [ ] Rerun both test files. Verify all fetched site URLs, including contact extraction, use the safe boundary.
- [ ] Commit: feat: add bounded website and SEO research.

## Task 5: Discovery adapters and review classification

**Files:** Create src/lib/discovery/types.ts, google.ts, public-web.ts, normalize.ts, tests/unit/discovery.test.ts, tests/fixtures/discovery/*.json; modify src/lib/google-maps.ts and src/lib/email-finder.ts.

**Interfaces:** searchGoogle(config: {city, industry, limit}, credentials, signal?): Promise<{candidates: Candidate[], warnings: string[]}>; searchPublicWeb(config: {source: "facebook" | "craigslist", city, industry, limit}, credentials, signal?): same return type; matchCandidate(candidate, existing: Candidate[]): string | null. Provider fetch is injected for tests.

- [ ] Write fixture assertions for Google pagination/service area businesses, zero rating retained when not filtered, missing provider key, 429 response, mixed source failure, homeowner request rejection, unknown company name requiring review, expired listing, and unknown freshness remaining unknown.
- [ ] Write identity assertions: same name in Dallas and Austin remains separate; verified same domain or place ID merges evidence; Facebook and Craigslist platform domains are not business identity keys. Run test and confirm failure.
- [ ] Implement current Places Text Search POST with explicit fields and pagination. Implement Firecrawl public web queries with correct source domain constraints and regional Craigslist mapping. Do not scrape Google results HTML. Preserve discovered URL, timestamps and snippets; candidate extraction must not guess hidden fields.
- [ ] Rerun discovery fixtures and verify provider errors are surfaced as statuses without returning fake results.
- [ ] Commit: feat: add sourced Google Facebook and Craigslist discovery.

## Task 6: Durable discovery jobs and research persistence

**Files:** Create src/db/discovery.ts, src/lib/discovery/worker.ts, scripts/discovery-worker.ts, src/app/api/searches/[id]/route.ts, src/app/api/searches/[id]/cancel/route.ts, src/app/api/candidates/[id]/review/route.ts, tests/integration/discovery-jobs.test.ts; modify src/app/api/searches/run/route.ts and src/lib/lead-search.ts.

**Interfaces:** enqueueSearch(orgId, config: SearchJobConfig): Promise<{jobId: string}>; processNextSearchUnit(workerId: string): Promise<boolean>; getSearchJob(orgId, id): Promise<JobSummary>; cancelSearch(orgId, id): Promise<void>. Define JobSummary with state, source results, counts, warnings, and heartbeatAt.

- [ ] Test that POST returns 202 with a job ID; two workers cannot claim the same unit; stopped workers release a lease; cancelled jobs stop future units; successful sources survive a failed source; repeated job processing never duplicates a prospect or evidence.
- [ ] Test missing website and unverified email, stale social results, and ambiguous provider candidates remain reviewable. Run integration tests on the disposable schema.
- [ ] Split work into source/city/industry units. Claim with a database transaction and SKIP LOCKED; use a 60 second renewable lease and heartbeat every 15 seconds. Default maxUnits 30, maxCandidates 50, maxResultsPerQuery 10; server enforced maximums 100, 200, and 20. Validate the full requested combination count before dispatch. Renew during audits and honor cancellation between bounded fetches.
- [ ] Persist progress after each unit. Save verified provider candidates with evidence, retain uncertain candidates in review, apply quality filter only when assessment is known, and permit Show All for SEO prospects. Rerun worker recovery and cross organization tests.
- [ ] Commit: feat: make discovery resumable with visible progress.

## Task 7: Personal website and SEO outreach drafts

**Files:** Create src/lib/outreach/agency-draft.ts, tests/unit/agency-draft.test.ts; modify src/lib/ai-drafter.ts, src/lib/sequence-templates.ts, src/app/api/prospects/[id]/draft/route.ts.

**Interfaces:** buildAgencyDraftContext({prospect, findings: Finding[], offerType: OfferType, senderName: string}): {system: string, user: string}. Extend DraftRequest with optional offerType and findings; preserve existing lending and contractor paths.

- [ ] Test a good website with a missing location description produces an SEO offer, an unavailable site cannot support claims about broken design, and a seasonal installer retains its real trade. Assert prompt context prohibits fabricated traffic, ranking promises, financing language, software subscriptions, and unsupported lead loss claims.
- [ ] Test source content containing instructions is delimited as untrusted data; no email, rating, or owner name is invented. Assert agency templates contain no banned wording or dash punctuation. Run tests and confirm failure.
- [ ] Replace agency product selling language with Neal's personal website and SEO services. Present one or two observed issues, a clear offer, and an editable reply request. Keep drafts editable and return truthful setup errors when the model key is absent. Preserve nonagency templates without using them as defaults in the private CRM.
- [ ] Rerun draft tests using a stub model response. Manually review two drafts for factual scope and readability; no mail is sent.
- [ ] Commit: feat: personalize website and SEO outreach.

## Task 8: Send correctness and follow up controls

**Files:** Create src/lib/outreach/send-service.ts, src/db/send-intents.ts, tests/integration/send-intents.test.ts; modify src/app/api/gmail/send/route.ts, src/db/connections.ts, src/db/sequences.ts, src/app/(app)/app/actions.ts, src/app/(app)/app/sequences/actions.ts, src/components/pipeline/SendViaGmailButton.tsx.

**Interfaces:** sendApprovedIntent({orgId,userId,prospectId,intentId,expectedSender,subject,body}, deps): Promise<{state: SendIntentState, providerMessageId?: string}>. State changes use conditional database updates. stopProspectOutreach(orgId, prospectId, reason): Promise<void> sets pausedAt and clears nextActionAt on active enrollments.

- [ ] Assert two requests for one intent call the stub provider once; changed expected sender, missing authenticated email, disconnected account, stopped prospect, and wrong org all produce no send.
- [ ] Assert provider acceptance plus log failure preserves sent evidence or unknown reconciliation state and blocks automatic resend. Provider timeout is unknown, not safe to retry. Replied, Not Interested, and Do Not Contact persist a separate outreachDisposition rather than replacing legacy pipeline enum values. Old completed enrollments remain completed. Run tests and confirm failure.
- [ ] Resolve and display actual Gmail identity, require a prepared intent for sending, and validate recipient/subject against header injection. Persist sending before provider invocation and sent after provider confirmation. Add manual reply/stop controls and paused task filtering. Keep inbox read permission absent and describe reply tracking as manual.
- [ ] Rerun integration tests with only a stub provider. Confirm changing connected identity invalidates prepared intents and no test calls a live Gmail endpoint.
- [ ] Commit: fix: make personal outreach sends and follow ups reliable.

## Task 9: Redesigned private CRM interface

**Files:** Create src/components/crm/PrivateShell.tsx, SearchComposer.tsx, SourceStatus.tsx, ResearchPanel.tsx, TodayTasks.tsx, SenderBadge.tsx; modify src/components/site/AppHeader.tsx, src/app/(app)/layout.tsx, src/app/(app)/app/PipelineClient.tsx, src/app/(app)/app/page.tsx, src/app/(app)/app/searches/page.tsx, src/app/(app)/app/prospects/page.tsx, src/components/pipeline/Filters.tsx, ProspectDrawer.tsx, FindProspectsModal.tsx, src/app/(app)/app/settings/SettingsClient.tsx and page.tsx, src/app/globals.css.

**Interfaces:** Components consume JobSummary, AuditResult, Finding, and the extended Prospect contract from earlier tasks. No component calls provider endpoints directly. Store filter state in URL query parameters, preserving search, city, industry, source, websiteState, offerType, and status.

- [ ] Add browser checks for real empty states, failed sources alongside successful results, missing sender identity, unknown website state, a good website retained as an SEO prospect, stopped follow ups, and a legacy prospect without research fields.
- [ ] Use a private desktop sidebar and mobile navigation with Today, Prospects, Pipeline, Searches, Outreach, Settings. Use dark neutral surfaces and orange actions; source chips, visible research dates, compact rows, and a prospect details panel. Today shows actual due actions and research queue counts rather than fabricated analytics.
- [ ] Replace the large search modal with source selection, original and seasonal presets, editable cities, run limits, and live database backed job progress. In Settings show connection states and masked server credential presence, not plaintext keys or a subscription upsell.
- [ ] Inspect at 390px and 1440px widths. Verify keyboard focus, labels, drawer escape, color contrast, no horizontal overflow, and persistent filters after returning from details. Run targeted browser checks; keep screenshots internal.
- [ ] Commit: feat: redesign the private prospecting workspace.

## Task 10: Release verification and operator documentation

**Files:** Modify README.md, railway.json, package.json; create .env.example, docs/private-crm-operations.md, tests/e2e/private-crm.spec.ts, playwright.config.ts, scripts/verify-private-crm.ts. Add a locked browser test dependency only if the available runtime does not already provide the required browser harness.

**Interfaces:** Document PRIVATE_OWNER_CLERK_ID or PRIVATE_OWNER_EMAIL, DATABASE_URL, Google OAuth values, NEXT_PUBLIC_APP_URL, FUNNELCLOSER_GMAPS_API_KEY, FIRECRAWL_API_KEY, ANTHROPIC_API_KEY, and the existing encryption key name from src/lib/crypto.ts. Include a separate web and discovery worker process. Preserve existing production configuration until a reviewed release.

- [ ] Verify every API and action requires owner context, source keys never reach client props, production has no seed fallback, root opens the private CRM, and original records survive a migration rehearsal. Add the five Review Focus failures to their owning test suites if any remain uncovered.
- [ ] Document TOKEN_ENCRYPTION_KEY as the stable encryption key, backup, additive migration, worker health, reconnecting personal Gmail, manual reply handling, missing provider setup, search budgets, and rollback. Preserve existing encrypted connections by requiring the existing effective encryption secret when introducing an explicit key; do not rotate it during this release. Mark live integrations not tested when credentials are unavailable. Do not invent current service pricing or free allowances.
- [ ] Run pnpm test:unit, pnpm test:integration against disposable storage, pnpm exec tsc --noEmit, pnpm lint, pnpm build, and browser checks. Build must not require a live database connection merely to render static routes; fix import time production failures rather than using production credentials.
- [ ] Review the final diff for dropped original categories, deleted data, public registration paths, client visible keys, stale claims, and scope creep. Package the code changes on a review branch with an accurate draft PR. Do not merge, deploy over production, connect an account, or send prospect mail as part of verification.
- [ ] Commit: docs: verify and document the private CRM release.

## Self Review

Spec coverage: tasks 2 and 9 implement the private dashboard; task 3 preserves original and seasonal trades; tasks 4 through 6 cover discovery, evidence, SEO and uncertain results; tasks 7 and 8 cover personal outreach and stopped follow ups; tasks 1, 6 and 10 cover durable storage, migrations and validation. Website generation and billing are excluded throughout.

Dependencies: task 1 defines shared research/storage contracts; tasks 2 and 3 can then be reviewed independently; task 4 precedes task 5 contact extraction; task 6 consumes tasks 1, 3, 4 and 5; task 7 consumes research findings; task 8 consumes send storage; task 9 composes the tested interfaces; task 10 verifies the integrated release.

Native execution is recommended because this is one existing app with shared schema and UI types. Implement each task in this session and review the whole branch after integration. No agents have been spawned.

## Review Handoff

This plan is ready for review. Product code has not been changed. After Neal approves the plan and selects Native or Subagent execution, use the corresponding execution skill and carry the work through implementation and checks.

