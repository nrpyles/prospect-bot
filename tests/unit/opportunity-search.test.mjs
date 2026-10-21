import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../../src/lib/discovery/opportunities.ts').catch(()=>({}));
const audit=(codes=[],state='inspected',extra={})=>({websiteUrl:'https://example.com',state,findings:codes.map(code=>({code,title:code,confidence:'observed',category:code==='contact_path'?'website':'on_page_seo'})),checksRun:[],checksNotRun:['Search rankings and traffic'],...extra});
const business={website:'https://example.com',googlePlaceId:'place-1'};
test('one concrete conversion problem qualifies before a healthy site with minor metadata gaps',()=>{
 assert.equal(typeof m.assessOpportunity,'function');
 const need=m.assessOpportunity(audit(['contact_path']),business);
 const minor=m.assessOpportunity(audit(['missing_description','canonical_review']),business);
 assert.equal(need.kind,'website_repairs');assert.equal(need.offerType,'website_refresh');assert.equal(minor.kind,'none');
 assert.ok(need.score>minor.score);assert.equal(m.matchesOpportunity(need,'website_and_seo'),true);assert.equal(m.matchesOpportunity(minor,'website_and_seo'),false);
});
test('missing listing websites are prospects to verify rather than proof no website exists',()=>{
 assert.equal(typeof m.assessOpportunity,'function');
 const need=m.assessOpportunity(audit([],'missing',{websiteUrl:null}),{website:null,googlePlaceId:'place-1'});
 assert.equal(need.kind,'website_needed');assert.equal(need.offerType,'website_build');assert.match(need.reasons.join(' '),/Google.*link|linked.*Google/i);assert.match(need.nextAction,/confirm|verify|check/i);
 assert.doesNotMatch(need.reasons.join(' '),/has no website|does not have a website|not showing up/i);
 assert.equal(m.matchesOpportunity(need,'no_website'),true);assert.equal(m.matchesOpportunity(need,'seo'),false);
});
test('blocked sites never qualify as repair prospects while a returned 404 does',()=>{
 assert.equal(typeof m.assessOpportunity,'function');
 for(const errorCode of ['Website returned HTTP 403','Website request timed out','Private network targets are blocked']){
  const blocked=m.assessOpportunity(audit([],'unavailable',{errorCode}),business);
  assert.equal(blocked.kind,'review');assert.equal(m.matchesOpportunity(blocked,'website_and_seo'),false);
 }
 const broken=m.assessOpportunity(audit([],'unavailable',{errorCode:'Website returned HTTP 404'}),business);
 assert.equal(broken.kind,'website_repairs');assert.equal(m.matchesOpportunity(broken,'website_repairs'),true);
});
test('SEO qualification requires observed meaningful signals and makes no ranking claim',()=>{
 assert.equal(typeof m.assessOpportunity,'function');
 for(const codes of [['page_noindex'],['missing_title'],['missing_h1','missing_description']]){
  const need=m.assessOpportunity(audit(codes),business);assert.equal(need.kind,'seo');assert.equal(need.offerType,'seo_improvements');
  assert.doesNotMatch(need.reasons.join(' '),/is not indexed|not showing up|low ranking|lost leads/i);
 }
 const unsupported=m.assessOpportunity(audit(['missing_title'],'unchecked'),business);assert.equal(unsupported.kind,'review');
 const speculative=m.assessOpportunity({...audit(['page_noindex']),findings:[{code:'page_noindex',confidence:'needs_review'}]},business);assert.equal(speculative.kind,'none');
});
test('opportunity targets retain broad search as an explicit option',()=>{
 assert.equal(typeof m.matchesOpportunity,'function');
 const healthy=m.assessOpportunity(audit([]),business);
 assert.equal(m.matchesOpportunity(healthy,'all'),true);
 assert.equal(m.matchesOpportunity(healthy,'website_and_seo'),false);
});
test('a business with both website and SEO problems remains eligible for either service',()=>{
 const need=m.assessOpportunity(audit(['contact_path','page_noindex']),business);
 assert.equal(need.offerType,'website_plus_seo');assert.equal(m.matchesOpportunity(need,'website_repairs'),true);assert.equal(m.matchesOpportunity(need,'seo'),true);
});
test('search batches put the strongest matching needs before the candidate cap',()=>{
 assert.equal(typeof m.prioritizeSearchItems,'function');
 const items=[{candidate:{id:'healthy',website:business.website},audit:audit(['missing_description'])},{candidate:{id:'seo',website:business.website},audit:audit(['missing_title'])},{candidate:{id:'build',website:null,placeId:'p'},audit:audit([],'missing',{websiteUrl:null})}];
 assert.deepEqual(m.prioritizeSearchItems(items).map(i=>i.candidate.id),['build','seo','healthy']);
 assert.equal(items[0].candidate.id,'healthy');
});
test('new research refreshes generated suggestions while preserving different user choices',()=>{
 assert.equal(typeof m.refreshSuggestedFields,'function');
 const before=m.assessOpportunity(audit([],'missing',{websiteUrl:null}),{website:null});
 const after=m.assessOpportunity(audit(['missing_title']),business);
 assert.deepEqual(m.refreshSuggestedFields({offerType:before.offerType,nextAction:before.nextAction},before,after),{offerType:'seo_improvements',nextAction:after.nextAction});
 assert.deepEqual(m.refreshSuggestedFields({offerType:'website_refresh',nextAction:'Call owner on Friday'},before,after),{});
 assert.deepEqual(m.refreshSuggestedFields({offerType:before.offerType,nextAction:before.nextAction},before,null),{offerType:null,nextAction:null});
 const healthy=m.assessOpportunity(audit([]),business);
 assert.equal(m.refreshSuggestedFields({offerType:after.offerType,nextAction:after.nextAction},after,healthy).offerType,null);
});
