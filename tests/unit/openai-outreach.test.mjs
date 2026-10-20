import test from 'node:test';import assert from 'node:assert/strict';
const service=await import('../../src/lib/outreach/personalized-ai.ts').catch(()=>({}));
const research={coverage:'complete',checkedAt:new Date().toISOString(),pageLimit:25,discoveredPages:1,warnings:[],pages:[{url:'https://example.com/services',title:'Lighting',content:'We include seasonal takedown and storage.',truncated:false}]};
const input={prospect:{name:'Example Lights',industry:'Christmas Light Installation',city:'Plano',website:'https://example.com',researchState:'inspected'},findings:[],offerType:'website_plus_seo',senderName:'Neal',research};
const draft={subject:'an idea for your lighting services',body:'Hey there, I noticed seasonal takedown and storage on your site. I help local businesses make their service details easier to find. Want me to send over two ideas?',reasoning:'Uses a documented business service.',sourceUrl:research.pages[0].url,sourceQuote:'seasonal takedown and storage'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const completed=data=>({id:'resp_fixture',object:'response',status:'completed',output:[{type:'reasoning',summary:[]},{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(data),annotations:[]}]}]});

test('OpenAI outreach sends researched context and parses Responses API text',async()=>{
 assert.equal(typeof service.draftPersonalizedEmail,'function');
 let calls=0;
 const actual=await service.draftPersonalizedEmail(input,{apiKey:'fixture-only',request:async(url,init)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(init.headers.Authorization,'Bearer fixture-only');
  const body=JSON.parse(init.body);assert.equal(body.store,false);assert.ok(body.model.startsWith('gpt-'));assert.ok(body.input.includes('seasonal takedown and storage'));assert.equal(body.text.format.type,'json_schema');
  return json(completed(draft));
 }});
 assert.equal(calls,1);assert.equal(actual.body,draft.body);assert.equal(actual.sourceUrl,research.pages[0].url);
});

test('OpenAI outreach rejects incomplete, refused and unsupported-source results',async()=>{
 assert.equal(typeof service.draftPersonalizedEmail,'function');
 await assert.rejects(service.draftPersonalizedEmail(input,{apiKey:'fixture-only',request:async()=>json({...completed(draft),status:'incomplete'})}),/finish|incomplete|limit/i);
 await assert.rejects(service.draftPersonalizedEmail(input,{apiKey:'fixture-only',request:async()=>json({status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'Cannot generate.'}]}]})}),/declined|refus/i);
 await assert.rejects(service.draftPersonalizedEmail(input,{apiKey:'fixture-only',request:async()=>json(completed({...draft,sourceQuote:'fabricated business details'}))}),/source|quote/i);
});

test('OpenAI errors never echo provider response data or retry billable work',async()=>{
 assert.equal(typeof service.draftPersonalizedEmail,'function');
 let calls=0;
 await assert.rejects(service.draftPersonalizedEmail(input,{apiKey:'fixture-only',request:async()=>{calls++;return json({error:{message:'secret-fixture-provider-data'}},429);}}),error=>/OpenAI/.test(error.message)&&!/secret-fixture/.test(error.message));
 assert.equal(calls,1);
 await assert.rejects(service.draftPersonalizedEmail(input,{apiKey:'',request:async()=>{throw Error('must not call');}}),/OpenAI.*configured|OPENAI_API_KEY/i);
});
