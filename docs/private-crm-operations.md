# Private CRM operations

## Deployment preparation

Use the existing application configuration and a separate review branch. Do not replace an existing production deployment until the production build, migration rehearsal, private login, and browser checks pass.

Run the web and discovery worker as separate services sharing the same database and owner configuration. Web command: `pnpm start` after `pnpm build`. Worker command: `pnpm worker`. The worker is not a public HTTP service and should not receive a public domain or web health check. A process health endpoint for the web service is `/api/health`; this endpoint doesn’t claim provider or database readiness.

## Owner access

Set PRIVATE_OWNER_CLERK_ID to the existing authorized Clerk user ID. A configured ID takes precedence over email. Alternatively set PRIVATE_OWNER_EMAIL; only a verified email on the current Clerk account is accepted. Keep sign ups disabled in the Clerk application. The app also redirects its sign up route and denies unconfigured owners before creating a workspace.

Set NEXT_PUBLIC_APP_URL to the actual web URL. Use the matching personal Gmail OAuth redirect URL in Google. No new domain purchase is necessary to test an existing deployment URL.

## Preserve data

Make a database backup using the provider’s backup tool or pg_dump. Restore it into a separate test database and use that database to rehearse migrations and integration checks.

Run `pnpm exec tsx scripts/migrate.ts` to apply the recorded migrations. The new migration only adds tables and columns and fills new research states as unchecked. It does not erase or reclassify existing prospects. Existing pipeline enums are preserved. Original lending and contractor records remain stored.

The original project had standalone scripts for workspace mode columns. The new migration accounts for those columns using IF NOT EXISTS. The next schema snapshot is recorded for future migration generation. Rehearse the migration before any production use.

## Encryption and personal Gmail

TOKEN_ENCRYPTION_KEY must remain stable. The earlier application derived its token key from TOKEN_ENCRYPTION_KEY, CLERK_SECRET_KEY, or ANTHROPIC_API_KEY, in that order. When introducing an explicit key, use the same secret that was effective before; otherwise existing encrypted connections will need reconnection. Never paste these values into chat or commit them.

Reconnect personal Gmail in Settings when tokens expire or the sender changes. The actual authenticated email is displayed before sending. Reconnecting or disconnecting invalidates prepared messages. The app doesn’t read your inbox; mark Replied, Not Interested, or Do Not Contact on the prospect. Those actions stop future due work and cancel prepared messages.

If a send is shown as unknown or still sending, check the correct account’s Gmail Sent folder. Do not generate a replacement email merely to retry. A provider may have accepted the original even if local logging failed. An operator can reconcile send_intents by its provider message ID, then record the actual result. Do not clear an intent back to prepared without confirming the mail was not sent.

## Search controls

Google uses Places Text Search. The server may reuse the existing organization Google key. Facebook and Craigslist use public indexed search. Private groups, hidden Craigslist reply addresses, and complete platform coverage are not provided.

Searches start only from an explicit user action. Defaults are 30 source/city/trade combinations, 50 saved or review candidates, and 10 results per query. Server limits are 100 combinations, 200 candidates, and 20 results per query. These are application volume limits, not a guaranteed monetary spending cap. Configure provider billing limits separately.

A queued job without a heartbeat means the worker hasn’t picked it up. Check the worker process and database connection. Running units renew a 60 second lease every 15 seconds. After a worker restart, expired leases can be reclaimed. Successful results survive source failures. Partial and failed results include notes. No mock leads are substituted.

Review social listings before accepting them. Confirm the company name, contact information, website and date using the original source. A homeowner asking for a provider is not a business lead.

## Website and SEO checks

The app inspects static HTML and a small number of internal links. It records observations about metadata, headings, contact paths, viewport, canonical and robots directives, and structured data syntax. It doesn’t measure rankings, traffic, real indexing, rendered mobile usability, or page performance. Missing and inaccessible websites have different states. A good website can remain an SEO prospect.

## Verification and rollback

Use a disposable TEST_DATABASE_URL with permission to create and drop test schemas. Never use the production database. Integration tests create random test schemas and clean up their own resources. Run the unit and integration suites, type checking, lint, production build, and authenticated browser checks before release.

For a release regression, stop the discovery worker, roll the application back to the prior known good commit, and retain the new additive data. Do not drop new tables as an automatic rollback. If necessary restore the predeployment backup into a separate database and review before changing the live connection.

## Current verification limit

Dependency installation was blocked in the build environment. Production compilation, database integration, browser rendering, live provider calls, and OAuth must still be verified with the configured environment. No paid service was activated and no prospect email was sent during development.

## Browser verification

Use a test deployment with the private owner configured. Export a Playwright owner session to a local file ending in .auth.json, which is ignored by git. Do not commit session cookies. Set CRM_E2E_BASE_URL and CRM_E2E_STORAGE_STATE to that deployment and session file. The browser harness uses Playwright from the runtime; if it is not installed in the project, point CRM_PLAYWRIGHT_MODULE to the runtime package module. Run pnpm test:e2e. It intercepts only browser read responses with explicit test fixtures and makes no provider or send requests.

Run pnpm verify:crm for the release checklist. It exits unsuccessfully if required database or browser setup is missing, so skipped checks cannot be mistaken for a release pass. Browser fixture checks supplement real owner login, migration and provider checks; they do not prove those integrations.
