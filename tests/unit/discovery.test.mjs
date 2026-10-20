import test from 'node:test';import assert from 'node:assert/strict';
const n=await import('../../src/lib/discovery/normalize.ts').catch(()=>({}));
const g=await import('../../src/lib/discovery/google.ts').catch(()=>({}));
const w=await import('../../src/lib/discovery/public-web.ts').catch(()=>({}));
const candidate=(name,city,website,placeId=null)=>({id:name+city,businessName:name,city,website,placeId,phone:null,evidence:[{verifiedFields:['website','businessName']}]});
test('same name across cities is not sufficient identity evidence',()=>{
 assert.equal(typeof n.matchCandidate,'function');
 assert.equal(n.matchCandidate(candidate('Acme','Dallas',null),[candidate('Acme','Austin',null)]),null);
 assert.equal(n.matchCandidate(candidate('Acme','Dallas','https://acme.example'),[candidate('Acme','Dallas','https://acme.example/')]),'AcmeDallas');
 assert.equal(n.matchCandidate(candidate('Acme','Dallas','https://facebook.com/one'),[candidate('Acme','Dallas','https://facebook.com/two')]),null);
});
test('homeowner requests remain requests and unverified names require review',()=>{
 assert.equal(typeof n.classifyProvider,'function');
 assert.equal(n.classifyProvider('Looking for someone to install Christmas lights. Any recommendations?'),'homeowner_request');
 assert.equal(n.classifyProvider('We offer Christmas lighting. Call us for an estimate.'),'provider');
 assert.equal(n.classifyProvider('Christmas lights'),'unknown');
});
test('Google uses new search with pagination and retains unrated service area businesses',async()=>{
 assert.equal(typeof g.searchGoogle,'function');let page=0;
 const out=await g.searchGoogle({city:'Frisco, TX',industry:'Christmas Light Installation',limit:2},{apiKey:'test'},undefined,async(url,opts)=>{
  assert.equal(url,'https://places.googleapis.com/v1/places:searchText');assert.equal(opts.method,'POST');
  assert.equal(JSON.parse(opts.body).includePureServiceAreaBusinesses,true);
  page++;return new Response(JSON.stringify({places:[{id:'place'+page,displayName:{text:'Lighting '+page}}],...(page===1?{nextPageToken:'next'}:{})}));
 });assert.equal(page,2);assert.equal(out.candidates.length,2);assert.equal(out.candidates[0].businessName,'Lighting 1');
});
test('public search is source constrained and cannot fabricate current freshness',async()=>{
 assert.equal(typeof w.searchPublicWeb,'function');
 const r=await w.searchPublicWeb({source:'craigslist',city:'Frisco, TX',industry:'Gutter Cleaning',limit:3},{apiKey:'test'},undefined,async(url,opts)=>{
  assert.ok(JSON.parse(opts.body).query.includes('site:dallas.craigslist.org'));
  return new Response(JSON.stringify({success:true,data:{web:[{url:'https://dallas.craigslist.org/ndf/sks/d/a/123.html',title:'Gutter cleaning',description:'We offer gutter cleaning. Call for a quote.'}]}}));
 });assert.equal(r.candidates[0].reviewRequired,true);assert.equal(r.candidates[0].businessName,null);assert.equal(r.candidates[0].evidence[0].freshness,'unknown');
 await assert.rejects(w.searchPublicWeb({source:'facebook',city:'Dallas',industry:'Roofing',limit:2},{},undefined),/not configured/);
});
