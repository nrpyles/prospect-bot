# Private CRM build validation

This is an implementation for review, not a verified production release. No accounts were connected, no prospect messages were sent, and no paid provider requests were made during development.

## Verified in this environment

* Native Node domain suite: 34 passed, zero failed.
* Five database tests explicitly skipped because TEST_DATABASE_URL was absent. These do not count as passes.
* TypeScript 5.9.3 transpile checks: 125 TS and TSX files, zero syntax diagnostics. Transpiling does not perform semantic type checking.
* Original catalog comparison: all 106 original industries remain, with nine seasonal additions. All 14 original statuses remain.
* The dependency lockfile is unchanged. The new database migration is additive; no production database was accessed.

## Not verified

Package downloads returned HTTP 403 while pnpm checked dependency metadata and tried to install the locked dependencies. The check was not disabled. As a result, pnpm exec tsc --noEmit, pnpm lint, pnpm build, and pnpm test:e2e could not reach their tools. No successful framework build, lint pass or browser rendering is claimed.

Migration preservation, worker claim concurrency, lease recovery, and send intent database transactions have integration tests but require installed dependencies and a disposable Postgres database. OAuth consent, personal sender reconnection, actual provider searches and Gmail delivery remain untested.

The browser harness uses an owner session on a configured test app. Its explicit browser read fixtures cover empty and legacy records, a good website with an SEO offer, missing sender, partial search status, URL filters, drawer Escape, and document width at 390 and 1440 pixels. It does not prove live provider or database behavior.

## Before release

Install the existing locked dependencies, restore a backup to disposable storage, configure the owner test session, then run pnpm verify:crm. Resolve every failed or unavailable check before replacing a running deployment. Run the web application and the separate search worker with the same database. Follow docs/private-crm-operations.md for stable encryption keys, personal Gmail configuration, backup and rollback.

## Independent review and fix pass

A fresh read only reviewer found eight Important issues and no Critical issues. The implementation adds persisted uncertain delivery warnings and prepare blocking, durable sequence send identity with transactional advancement, website audit URL binding and invalidation, legacy stopped status filtering, rejection only listing validation, immediate closure of unused HTTP bodies, unknown location handling, and conditional enrollment completion. The available domain and transport regressions were observed failing and then passing. Database and browser regression tests were added but cannot establish those integration guarantees until run in the configured environment.

Two minor issues are deferred: the shared legacy prospect DTO still maps null quality to No Website, although the new UI uses researchState; and the missing website template can imply a listing was reviewed when no source evidence exists. Review that wording before sending. The original lending and contractor templates are retained without reauditing their claims.

## Build decisions

* Ruling: Existing source was restored through the authorized GitHub connector because shell cloning is blocked. Local branch has a snapshot baseline rather than original Git ancestry; deliver changes against the recorded remote baseline.

* Ruling: Dependency installation is blocked by registry network and unavailable offline metadata. Continue implementation with native Node TypeScript tests, and report unavailable framework/database checks honestly. No policy checks are disabled.

* Ruling: Use native Node 24 type stripping for dependency free domain tests while tsx cannot install; production package versions remain unchanged. Cost if wrong: runtime checks must be repeated with installed dependencies before release.

* Ruling: Hand authored idempotent additive migration and registered journal entry because drizzle-kit cannot install. Preserve the existing migration snapshot; regenerate the next Drizzle metadata snapshot only after dependencies are available. Cost if wrong: migration rehearsal must catch schema discrepancies before deployment.

* Ruling: Read official Next.js 16 documentation as installed version guides are unavailable while installation is blocked. Keep current framework APIs; production build remains a required unverified check.

* Ruling: Use a bounded dependency free static metadata tokenizer for first page findings so the actual research logic can be verified without blocked packages; Cheerio remains in the existing contact extractor. Static checks explicitly exclude rendered usability and rankings. Cost if wrong: HTML edge cases can require manual review, which findings disclose.

* Ruling: Existing email discovery remains a manual prospect action; avoid adding seven website fetches per new lead during search. Cost if wrong: one extra click before email outreach.

* Ruling: Use existing organization Google key server side when present, with environment key taking precedence, rather than forcing a second key entry. Keys are never returned to clients. Cost if wrong: provider configuration must be checked before live searches.

* Ruling: Record the next Drizzle metadata snapshot manually against the additive SQL because drizzle-kit remains blocked. This supersedes the earlier deferral of the snapshot; database rehearsal is still required. Cost if wrong: future generated migrations can differ until corrected against a disposable database.

* Ruling: Use Node test runner with the runtime Playwright package via an explicit module path instead of adding an unresolvable browser dependency or changing the lockfile. Cost if wrong: the operator must supply the Playwright module and owner test session before browser verification.

* Final: Ruling: Mail already conditionally claimed before stop or disconnect can complete as an in flight operation. Prepared intents remain cancellable. Cost if wrong: one already approved email may complete after a stop.

* Final: Ruling: Live providers, OAuth, deployment and real delivery are untested, as are semantic TypeScript, lint, production build, PostgreSQL execution and browser rendering. Fixtures and syntax checks do not stand in for them. Cost if wrong: release defects remain possible, so keep this a draft until configured checks pass.

* Final: Ruling: Preserve existing lending/contractor records and templates without reauditing their financial claims, because this implementation changes the website/SEO workflow. Cost if wrong: old templates need review before reuse.

* Final: Ruling: Follow the approved implementation plan's email and URL filter contract; dedicated DM/call drafts and extra seasonal/finding/next action filter controls are deferred scope, not claimed fulfilled. Cost if wrong: those workflows need manual notes and source links until another iteration.

* Final: Ruling: Deliver a separate draft review branch and PR as specified in Task 10. Main and production stay unchanged; the final integration menu is already resolved by that authorized deliverable. Cost if wrong: review the draft before choosing a release.

## Delivery status

The implementation is committed on the isolated codex/private-crm-build branch and prepared for a draft pull request. Publication to the public nrpyles/prospect-bot repository was initially paused by automatic approval review. Neal explicitly approved that publication on October 20, 2026. No merge or production deployment is part of this handoff.

## Owner email and access shortcut update

At Neal’s request, private CRM access now requires the verified email nrpyles@gmail.com on the signed in Clerk account. This replaces the earlier environment-selected owner policy. The website shortcut is a Netlify 302 redirect from both /prospectbot and /prospectbot/ to the reviewed Vercel branch. Vercel reported the prior CRM commit deployed successfully on October 20, 2026; authenticated database, worker, provider and OAuth checks remain separate. The build environment could not open the Vercel page because outbound browser requests were restricted, so live sign in is not claimed verified.

## Setup failure investigation

The owner supplied a screenshot of the generic setup failure screen on October 20. That screen previously combined Clerk account loading and workspace database exceptions, so it could not establish the failing component. Owner-only, sanitized failure codes now distinguish absent DATABASE_URL, missing schema, credentials, permissions, connection and record conflicts from a sign in service failure. Raw provider messages, SQL and credentials are not rendered. Three diagnostic regressions were observed failing then passing. Live backend configuration and the actual failure code still require the deployed screen or Vercel server logs; this change improves diagnosis and does not declare the underlying setup issue fixed.


## Vercel search execution follow-up, October 20

After the owner reported working login and database setup, source inspection found that enqueueing and polling never invoked the separately hosted discovery worker on Vercel. The Searches page now invokes an authenticated POST for one owner-scoped, leased batch per request. It stops starting batches on page exit, resumes unfinished work when reopened, and exposes a manual Resume search action after transport failures. The optional CLI worker remains supported. Vercel work is bounded to 240 seconds, with an 8-second inspection budget per website and a 300-second route duration.

Four new execution regressions were observed failing before the implementation and passing after it. Native Node unit and integration test command: 38 passed, five real database tests explicitly skipped because TEST_DATABASE_URL is unavailable. The added skipped database regression covers owner/job scoping, a live batch blocking another tab, and expired lease recovery. TypeScript 5.9 syntax transpilation passed for 127 files; this is not semantic type checking. `pnpm test` attempted an automatic dependency installation and was blocked by the existing registry 403 and supply-chain checks; no policy bypass was used. Vercel build status and a configured first live search must still be checked. No provider search or email was sent by this change.


The focused read-only review found two issues, both addressed before publication: all claim paths now lock the job and exclude live units, including mixed CLI and web execution; scoped database assertions share the original fixture so they do not reuse an ended cached client. The database test additionally issues simultaneous scoped claims. Database execution remains skipped, not claimed as verified. Production build and authenticated browser/provider execution remain deployment checks.
