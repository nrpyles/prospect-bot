# FunnelCloser: Private Prospecting CRM

Status: Revised design for review. Product implementation has not started.
Date: October 19, 2026, America/Chicago.
Repository: nrpyles/prospect-bot.
Baseline: aa2d31d2d006134971863289404c2b26069df325.

## User direction

This is Neal's private tool for finding businesses and managing his own outreach.
The commercial offer is building or improving a business website and helping improve SEO.
Retain original business categories and add Christmas lighting and other seasonal trades.
Discovery should cover Google, public Facebook results, and public Craigslist listings.
Outreach should use Neal's personally connected email.

The requested deliverable is the backend search and CRM with a private dashboard.
It is not software to sell. A public marketing site, pricing page, subscription billing,
customer registration flow, website generator, preview hosting, and client portal are outside this build.
Actual client website work happens separately. The CRM can retain an external project or demo link
when Neal has one, without generating or hosting websites.

Assumptions: retain the existing web foundation; start with DFW and editable locations;
retain the recognizable dark interface and orange accent. A private web interface lets Neal
use the backend from phone or computer. Personal Gmail is the initial email provider.
The actual OAuth connected address is authoritative. No email account is connected by this design.

## Recommended approach

Adapt the existing Next.js, Postgres, authentication, Google discovery, email connection,
prospect pipeline, and follow up infrastructure into a private CRM.
This is smaller than rebuilding the older Python dashboard or creating a new product.

The root route opens the authenticated CRM, redirecting unauthenticated visitors to sign in.
Access is restricted to Neal's authorized account. Existing authentication and organization
ownership checks remain. Do not expose open registration or subscription flows.
Do not delete existing prospect, sequence, lending, or contractor data.

## Existing code findings

The existing repository includes a broad industry catalog, pipeline and list views,
website scoring, contact extraction, AI outreach drafting, Gmail OAuth and outbound logging,
and sequence due actions. These are code observations, not verified live behavior.

Google discovery currently uses legacy Places endpoints. Facebook is currently a research link.
Craigslist has no discovery adapter. The current Gmail scope supports sending but not inbox reading.
Some source failures are swallowed and duplicate detection uses business name alone.

## 1. Search

Keep all existing business categories. Add:
Christmas Light Installation, Holiday Decorating, Permanent Outdoor Lighting,
Gutter Cleaning, Leaf Cleanup, Fall Yard Cleanup, Snow and Ice Removal,
Pool Winterization, and Chimney Cleaning.

Use existing categories such as HVAC, landscaping, tree service, window cleaning,
pressure washing, and junk removal in seasonal presets without duplicating them.
Keep all original industries available throughout the year.

Presets: Original Businesses, Fall and Holiday Trades, Winter Trades, and Custom.
Winter trades are selectable for relevant cities; presets do not assert current demand.

Sources:
1. Google business discovery through the Places API, plus website research links.
2. Public Facebook business pages and promotional posts found through indexed web search.
3. Public regional Craigslist service listings found through indexed web search.

Proposed runtime adapters: current Google Places Text Search and a server side Firecrawl
web search adapter using site constraints for Facebook and regional Craigslist domains.
Show direct research links and allow paste listing or manual prospect entry when indexing
does not expose content. A ChatGPT connector is not an application credential.

Do not represent public indexed discovery as complete native Facebook or Craigslist access.
Do not read private groups or assume hidden reply emails are available.
Keep source URL, query, discovery date, listing date when available, and freshness status.
Old or expired listings must not be labeled current.

A homeowner asking for an installer is not an installer prospect.
Ambiguous results enter a review queue.

## 2. CRM

Preserve existing prospect statuses and familiar pipeline behavior.
Each prospect includes company, industry, city, source links, website, public business contacts,
website and SEO findings, notes, status, last contact, next action, follow up date,
offer type, proposed fee, and optional external project or demo link.

Offer types: Website Build, Website Refresh, SEO Improvements, and Website Plus SEO.

Views: Today's Tasks, Prospects, Pipeline, Search History, Outreach, and Settings.
Filters: city, trade, seasonal preset, source, website state, SEO finding, status, and next action.

Deduplicate with place ID, canonical domain, public business phone, and name plus location.
Do not merge unrelated businesses by name alone. Keep multiple source records on one prospect.

Website states: Missing Standalone Website, Inspected, Unavailable, and Not Checked.
A Facebook page or Craigslist listing is not itself a standalone business website.
A fetch error must remain Unavailable, not automatically become a bad website score.

Preserve original website quality filters and add a Show All option.
Businesses with good looking websites can still be SEO prospects.
Store observed website quality separately from SEO opportunity.

## 3. Website and SEO opportunity checks

Keep the scope as prospect research and prioritized findings.
For pages actually inspected, record:
title and meta description; visible heading structure; service and location clarity;
contact or quote path; mobile viewport; canonical and robots directives;
broken internal links within a bounded check; and valid structured data when detectable.

Record URL, check date, evidence, confidence, and suggested improvement for each finding.
Identify checks not run or blocked. A viewport tag is not proof of good mobile usability.
Missing metadata is an opportunity to review, not proof of lost traffic.
Noindex on one inspected page does not establish the state of every page.
Structured data presence does not guarantee enhanced search results.

Group findings into Website, On Page SEO, and Local Visibility Research.
Google listing links can support manual profile research.
Do not claim rankings, search volume, traffic loss, indexing status, or a full technical audit
without the appropriate measurements or authorized source.
SEO check results do not automatically imply a business needs every service.

Opportunity summaries should select one or two substantiated issues Neal can discuss.
No invented ratings, credentials, testimonials, prices, or performance claims.

## 4. Personal outreach

Use the existing Gmail OAuth path with the actual connected personal account.
Display the sender address in Settings and before each send.
Use Neal Pyles as the sender name and website and SEO service language.
Do not insert mortgage, lender, or old company branding into this campaign.

Generate editable email, DM, and call drafts based on verified business facts.
Position the offer according to evidence: new website, website improvements,
SEO help, or a combined project. Do not promise first place on Google or guaranteed leads.

Retain sent history, sequence editor, and follow up due actions.
Unsent drafts do not become Email Sent.
A sequence must distinguish scheduled, manually completed, and provider confirmed sent actions.

Initially replies are marked manually. The current send only Gmail scope cannot detect replies.
Mark Replied, Not Interested, or Do Not Contact stops remaining due actions.
Automatic inbox synchronization is outside this first release.

Use provider message IDs and idempotent send intents to avoid duplicate sends.
If provider acceptance is known but logging fails, show uncertain local reconciliation
instead of automatically retrying the message.
Changing the connected account invalidates queued send approvals.

No actual outreach, test emails to prospects, or active campaign is authorized by this document.

## 5. Storage and job behavior

Use additive migrations for prospect evidence, website and SEO findings,
offer type, next actions, discovery jobs, and send intents.
Reuse existing tables where appropriate. Back up data before applying migrations.

Jobs expose queued, running, partial, complete, cancelled, and failed states.
Per source failures do not erase successful results.
Show progress counts, warnings, last run, and configurable search limits.
Missing credentials show setup instructions rather than a successful empty search.
No mock businesses appear as real results.

Keep provider keys server side. Preserve access checks on every prospect, search, and message.
Website fetches must reject private network destinations and unsafe redirect targets.
Escape imported content; external page text is evidence, never executable instructions.

## 6. Verification and release

Read AGENTS.md and the installed Next.js version documentation before changing framework code.
Validate with targeted behavioral tests, type checks, lint, production build, and mobile inspection.

Acceptance:
1. Original categories and prospect records remain usable.
2. Seasonal presets add to the original business search.
3. All three sources return normalized evidence or honest unavailable states.
4. Duplicate listings are combined without merging unrelated companies.
5. Blocked sites and stale listings keep their uncertainty.
6. SEO findings are evidence based and do not invent rankings or traffic.
7. Good website prospects can be retained for SEO outreach.
8. The authenticated personal sender is displayed and used correctly.
9. Send intents resist double clicks and uncertain provider responses.
10. Replied and Do Not Contact stop future due actions.
11. Private access works on phone and desktop.
12. The root opens the private CRM; there is no public sales funnel or software billing flow.

Live integration checks remain unverified until runtime keys and email connection are available.
Do not claim the app is rebuilt, deployed, or searching live before implementation and validation.

## Implementation sequence after design review

1. Private application entry and additive data changes.
2. Original and seasonal industry catalog.
3. Google, Facebook, and Craigslist discovery adapters and review queue.
4. Bounded website and SEO checks.
5. Prospect research views and task tracking.
6. Personal sender and follow up correctness.
7. Validation and deployment preparation.

## References

Existing project:
https://github.com/nrpyles/prospect-bot/tree/aa2d31d2d006134971863289404c2b26069df325

Google Text Search:
https://developers.google.com/maps/documentation/places/web-service/text-search

Public web search:
https://docs.firecrawl.dev/api-reference/endpoint/search
