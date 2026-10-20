# FunnelCloser: Original Website Outreach With Seasonal Trades

Status: Draft for Neal's review. Product implementation has not started.
Date: October 19, 2026, America/Chicago.
Repository inspected: nrpyles/prospect-bot.
Baseline commit: aa2d31d2d006134971863289404c2b26069df325.

## Agreed purpose

Neal wants his existing business outreach system retained and refreshed. The offer is creating or rebuilding websites for local businesses. Christmas lighting and other seasonal trades are additions to the original prospecting categories. This is Neal's own operating tool. Outreach should use his personal email account.

The business workflow is: find a business, verify its public information, identify a website opportunity, prepare a private redesigned website concept, draft personal outreach, manage follow ups, and record a sale.

Assumptions: the existing web app remains the foundation; DFW is the initial location preset and locations remain editable. The proposed personal account is nrpyles@gmail.com, based on Neal's supplied contact context; the authenticated connected address is authoritative and must be displayed before sending. No account is connected or message sent by this document.

## Approach decision

Recommended: retain the existing Next.js, Postgres, authentication, Gmail integration, pipeline, industry catalog, and sequence infrastructure. Refactor the experience around website sales and add discovery adapters and a website concept workspace.

Alternative: rebuild the older Python dashboard. This would require recreating persistence, authentication, and email connections already present in the web project. It is not recommended for this request.

The original categories and workflows remain available. The default workspace opens the agency website outreach flow. Existing lending and contractor records must remain readable and must not be migrated into website prospects automatically.

## Observed baseline

The project already contains a six stage pipeline, a broad industry catalog, website quality scoring, website email extraction, AI draft code, Gmail OAuth, outbound message logging, and sequence due actions. These are code observations, not verified live operation.

Google discovery currently uses legacy Places endpoints. The lead search defaults to missing or weak websites, deduplicates using business name, and silently ignores some email discovery failures. Facebook is currently a research URL. There is no Craigslist discovery adapter in the inspected code.

Gmail currently requests send permission and account identity. It does not provide inbox reading. Therefore the app cannot truthfully claim automatic reply detection using its current connection.

## 1. Discovery and seasonal categories

Preserve all original industries and add explicit categories:
Christmas Light Installation, Holiday Decorating, Permanent Outdoor Lighting, Gutter Cleaning, Leaf Cleanup, Fall Yard Cleanup, Snow and Ice Removal, Pool Winterization, and Chimney Cleaning.

Keep HVAC, tree service, pressure washing, window cleaning, landscaping, and junk removal from the existing catalog. Add seasonal presets that reference these existing categories rather than creating duplicates.

Presets:
1. Original website prospects.
2. Fall and holiday services.
3. Winter services, available for appropriate markets.
4. Custom industries and locations.

Seasonality is a search organization aid, not proof of current demand, availability, or suitability in a particular city. Neal can select any category at any time.

Three discovery source controls:
1. Google: Google Places search for business listings, ordinary website research, and Google research links. Update the Places adapter using the current Text Search API, explicit field masks, pagination, and service area business support.
2. Facebook: search indexed public business pages and promotional posts using a server side web search provider with domain constraints. Keep direct Facebook search links and a paste listing action for content Neal can access but indexing cannot retrieve.
3. Craigslist: search indexed regional service listings with regional domain constraints and provide a regional search link plus paste listing action. Listing dates, expired states, and unknown freshness must be visible.

The proposed web search adapter uses Firecrawl's documented search endpoint and site constraints. It must be clearly labeled Public Web Search, not represented as a complete native Facebook or Craigslist integration or guaranteed Google search coverage. A configured provider key belongs on the server. The ChatGPT connector is available for research in this conversation but is not an application runtime credential.

The first version makes no promise to read private groups, retrieve every listing, or extract hidden Craigslist reply addresses. Unavailable sources show a connection or access status. They never silently substitute mock businesses.

## 2. Evidence, normalization, and qualification

Every candidate records source platform, original URL, query, observed date, available posting date, extraction confidence, and which fields were actually verified.

A post asking for an installer is a homeowner request, not an installer prospect. Only service providers belong in the prospect queue. Ambiguous results remain in a review queue.

Normalize business identity with Google place ID when available, canonical business website, public business phone, and name plus location. Do not merge two companies solely because their names match. Multiple listings for one company become multiple evidence records on one prospect.

Website states:
1. No standalone website found.
2. Website inspected.
3. Website unavailable or blocked.
4. Website not checked.

A Facebook page or Craigslist listing is a discovery source, not automatically a standalone website. Failure to fetch a site is not proof the website is poor. Preserve the existing quality controls, while adding Unknown and review states through an additive migration.

The default website sales queue prioritizes verified missing or weak sites. A Show All control retains businesses with good sites and permits manual selection. Evidence based issues may include missing contact access, unclear service area, missing quote path, or poor mobile structure. Builder brand and stale copyright alone are not decisive sales arguments.

Unknown email remains unknown. Contact provenance is retained. Do not manufacture an owner name, email address, review, quote, response rate, or sales claim.

## 3. Website recreation workspace

Each prospect receives a Website Concept tab with:
original website and source links; verified business facts; service area; phone and email; real services; discovered asset references; missing information; design brief; editable page sections; versioned preview and export controls.

Create a new implementation of the business's site using its actual identity and verified facts. The default concept uses a clear hero, service sections, project gallery when sourced assets exist, service area, and a prominent contact or quote action.

For a business without a website, create a concept from verified listing information. Do not fill gaps with fake testimonials, invented licensing, awards, ratings, job counts, prices, or guarantees.

Keep concepts private and visibly labeled Concept Preview. Escape all imported content. A quote form in an unconnected preview must say it is a preview and must not report that an inquiry was delivered. Real lead delivery is separately configured for a client.

Generated pages use a constrained component schema with validated text and links rather than running arbitrary imported or model produced scripts. Host previews under unguessable access tokens with no search indexing. Tokens can be revoked. No discovery job automatically publishes a website.

The concept can be edited and exported as a standalone HTML package with local assets where supplied. External asset references retain their original source. Public client delivery is a separate step after the business approves the content and destination.

## 4. Personal email and outreach

Reuse OAuth for Neal's personal Gmail. Settings and the send screen show the connected address. The from address is taken from the authenticated connection, never from an arbitrary input. Switching to a different address requires reconnection and invalidates queued send approvals.

Use Neal Pyles as sender name and personal website service language. Do not insert Lone Star Financing, lender offers, or old organization signatures into website outreach. Existing nonagency workspaces retain their own settings.

Drafting uses verified observations and optional private concept links. Neal can edit every subject and body. Existing manual sending remains available after a successful connection check. Unsent drafts never change a prospect to Email Sent.

Preserve the sequence editor and due actions queue. An active sequence must distinguish planned, manually completed, and provider confirmed sent steps.

Initially replies are recorded manually because the current connection is send only. Mark Replied, Not Interested, or Do Not Contact cancels remaining due outreach. Automatic reply sync requires a later explicit inbox connection design and additional scope; it is not represented as already working.

Persist provider message IDs and thread IDs. Add an idempotency record before sending so repeated clicks do not generate duplicate mail. If the provider accepts a message but local logging fails, expose an uncertain delivery state for reconciliation rather than inviting an immediate resend.

No real outreach or campaign activation is included in design preparation or testing.

## 5. Dashboard and storage

Preserve the recognizable dark interface, orange accent, existing pipeline stages, manual prospect editing, original industry filters, and notes.

Add source and seasonal preset filters, website concept status, evidence drawer, connected sender badge, and daily research and follow up tasks. Provide list and pipeline views suitable for phone use.

Additive database structures:
discovery jobs and source run statuses; candidate review records; prospect evidence; verified website state; versioned website concepts; private preview tokens; and outbound send intent records.

Maintain organization ownership checks on every query and mutation even though the initial use is Neal's own workspace. Back up records before any migration. Do not remove original prospects or overwrite existing website assessments.

Source jobs have queued, running, partial, complete, failed, and cancelled states. Individual source failures do not erase successful results. Show counts, warnings, last successful run, and timestamps. Limit job volume through a visible configurable run budget.

## 6. Runtime and verification

The first release continues the existing web deployment model, with durable database storage and server side background jobs for discovery. Configuration must clearly distinguish required, optional, and connected services. Missing credentials create actionable statuses, not empty success screens.

Follow AGENTS.md and read the installed Next.js 16 documentation before changing framework code.

Required acceptance checks:
1. Existing categories, prospects, statuses, notes, and sequence due actions survive migrations.
2. Seasonal categories are selectable with correct query synonyms.
3. Each source adapter normalizes captured fixtures and handles empty, failed, and partially completed searches honestly.
4. Repeated listings merge evidence without merging unrelated companies.
5. Expired Craigslist listings, blocked websites, and homeowner request posts remain appropriately flagged.
6. Private preview links cannot expose another prospect, execute imported scripts, or claim form delivery.
7. Outreach uses the actual connected personal account, shows that address, and cannot send twice from the same send intent.
8. Replied and Do Not Contact states cancel future due actions.
9. Search, prospect details, concept editing, and outreach are usable on mobile.
10. Type checking, linting, production build, and targeted behavioral tests pass. Live provider tests remain explicitly unverified when deployment credentials are unavailable.

## Review and implementation sequence

This document is a concrete design for review. No product code or deployment is changed.

After design approval, write the implementation plan against the inspected repository and then execute in dependency order: additive data and seasonal catalog, discovery adapters, website concepts, personal sender and sequence correctness, dashboard integration, and validation.

Do not describe the system as rebuilt, deployed, searching live, or sending from Neal's email until those stages have been implemented and verified.

## Technical references

Existing code baseline:
https://github.com/nrpyles/prospect-bot/tree/aa2d31d2d006134971863289404c2b26069df325

Google Text Search:
https://developers.google.com/maps/documentation/places/web-service/text-search

Google legacy migration:
https://developers.google.com/maps/documentation/places/web-service/legacy/migrate-text

Public web search and domain operators:
https://docs.firecrawl.dev/api-reference/endpoint/search

Discovery observations in this session found Facebook promotional results and Craigslist service listings. Several Craigslist results were months old, supporting explicit freshness states rather than treating every search result as currently active.
