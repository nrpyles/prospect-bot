import test from 'node:test';
import assert from 'node:assert/strict';
const site=await import('../../src/lib/research/site-research.ts').catch(()=>({}));
const resolve=async()=>[{address:'8.8.8.8',family:4}];
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});

test('site research reads service and about pages and retains their source content',async()=>{
 assert.equal(typeof site.researchWebsite,'function');
 const fetched=[];
 const result=await site.researchWebsite('https://example.com',{apiKey:'test',resolve,request:async(url,init)=>{
  const body=JSON.parse(init.body);
  if(url.endsWith('/map'))return json({success:true,links:[{url:'https://example.com/services'},{url:'https://example.com/about'},{url:'https://elsewhere.example/services'},{url:'https://example.com/services?utm_source=test'}]});
  fetched.push(body.url);
  return json({success:true,data:{markdown:body.url.endsWith('/about')?'Family owned lighting team since 2012.':'We install roofline lighting and store lights after takedown.',metadata:{sourceURL:body.url,title:'Business page',statusCode:200}}});
 }});
 assert.equal(result.coverage,'complete');
 assert.equal(fetched.length,3);
 assert.equal(result.pages.length,3);
 assert.ok(result.pages.some(p=>p.url.endsWith('/about')&&p.content.includes('since 2012')));
 assert.ok(!fetched.some(url=>url.includes('elsewhere')));
});

test('a page budget produces honest partial coverage without more scrape calls',async()=>{
 assert.equal(typeof site.researchWebsite,'function');
 let scrapes=0;
 const result=await site.researchWebsite('https://example.com',{apiKey:'test',pageLimit:2,resolve,request:async(url,init)=>{
  if(url.endsWith('/map'))return json({success:true,links:[{url:'https://example.com/one'},{url:'https://example.com/two'},{url:'https://example.com/three'}]});
  scrapes++;const body=JSON.parse(init.body);return json({success:true,data:{markdown:'This is a service page for our local business.',metadata:{sourceURL:body.url,statusCode:200}}});
 }});
 assert.equal(scrapes,2);assert.equal(result.coverage,'partial');assert.ok(result.warnings.length);
});

test('one blocked page preserves other pages and does not become a missing website',async()=>{
 assert.equal(typeof site.researchWebsite,'function');
 const result=await site.researchWebsite('https://example.com',{apiKey:'test',resolve,request:async(url,init)=>{
  if(url.endsWith('/map'))return json({success:true,links:[{url:'https://example.com/contact'}]});
  const body=JSON.parse(init.body);if(body.url.endsWith('/contact'))return new Response('',{status:403});
  return json({success:true,data:{markdown:'We provide Christmas lighting in Frisco.',metadata:{sourceURL:body.url,statusCode:200}}});
 }});
 assert.equal(result.coverage,'partial');assert.equal(result.pages.length,1);
});

test('private destinations and missing credentials never start provider work',async()=>{
 assert.equal(typeof site.researchWebsite,'function');
 let calls=0;const request=async()=>{calls++;throw Error('must not call');};
 await assert.rejects(site.researchWebsite('https://example.com',{apiKey:'test',resolve:async()=>[{address:'127.0.0.1',family:4}],request}),/Private/);
 await assert.rejects(site.researchWebsite('https://example.com',{resolve,request}),/Firecrawl/);
 assert.equal(calls,0);
});

test('research starts at the homepage and checks alternate host DNS before scraping',async()=>{
 const fetched=[];const resolved=[];
 const result=await site.researchWebsite('https://example.com/login',{apiKey:'test',resolve:async host=>{resolved.push(host);return [{address:host.startsWith('www.')?'127.0.0.1':'8.8.8.8',family:4}];},request:async(url,init)=>{
  const body=JSON.parse(init.body);
  if(url.endsWith('/map'))return json({success:true,links:[{url:'https://www.example.com/services'}]});
  fetched.push(body.url);return json({success:true,data:{markdown:'We provide Christmas lighting installation.',rawHtml:'<title>Example</title>',metadata:{url:body.url,statusCode:200}}});
 }});
 assert.deepEqual(fetched,['https://example.com']);assert.ok(resolved.includes('www.example.com'));
 assert.equal(result.homeUrl,'https://example.com');assert.equal(result.coverage,'partial');
});
