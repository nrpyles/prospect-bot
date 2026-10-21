import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../../src/lib/outreach/prepare-draft.ts').catch(()=>({}));
test('preparing outreach uses the refreshed research offer rather than a captured old offer',async()=>{
 assert.equal(typeof m.prepareDraftProspect,'function');
 const saved={website:'https://example.com',offerType:'website_build'},fresh={...saved,offerType:'seo_improvements'};let inspections=0;
 const prepared=await m.prepareDraftProspect(saved,null,async()=>{inspections++;return fresh;});
 assert.equal(prepared.offerType,'seo_improvements');assert.equal(saved.offerType,'website_build');assert.equal(inspections,1);
});
test('matching recent page research is reused, while mismatched or invalid-dated research is refreshed',async()=>{
 assert.equal(typeof m.prepareDraftProspect,'function');
 const saved={website:'https://example.com',offerType:'website_refresh'};
 const research={websiteUrl:saved.website,state:'inspected',findings:[],checksRun:[],checksNotRun:[],siteResearch:{checkedAt:new Date().toISOString(),pages:[{content:'services'}]}};
 let calls=0;const inspect=async()=>{calls++;return saved;};
 await m.prepareDraftProspect(saved,research,inspect);assert.equal(calls,0);
 await m.prepareDraftProspect(saved,{...research,websiteUrl:'https://other.example.com'},inspect);assert.equal(calls,1);
 await m.prepareDraftProspect(saved,{...research,siteResearch:{...research.siteResearch,checkedAt:'invalid'}},inspect);assert.equal(calls,2);
});
