import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../../src/lib/crm-view.ts').catch(()=>({}));
test('a good website can remain an SEO prospect and filters preserve it',()=>{
 assert.equal(typeof m.filterProspects,'function');const p={id:'p',name:'Acme',city:'Dallas',industry:'Roofing',source:'Google Maps Bot',quality:'Good',researchState:'inspected',offerType:'seo_improvements',status:'New Lead'};
 assert.equal(m.filterProspects([p],{search:'acme',offerType:'seo_improvements'}).length,1);
 assert.equal(m.filterProspects([p],{source:'Craigslist'}).length,0);
});
test('Chicago day boundaries and stopped contacts do not create false follow ups',()=>{
 assert.equal(typeof m.businessDay,'function');assert.equal(m.businessDay(new Date('2026-10-20T02:00:00Z')),'2026-10-19');
 const p={id:'p',nextFollowUpAt:'2026-10-19',outreachDisposition:'active',status:'Interested'};
 assert.equal(m.dueProspects([p],new Date('2026-10-20T02:00:00Z')).length,1);
 assert.equal(m.dueProspects([{...p,outreachDisposition:'replied'}],new Date('2026-10-20T02:00:00Z')).length,0);
 assert.equal(m.externalUrl('javascript:alert(1)'),undefined);
});
