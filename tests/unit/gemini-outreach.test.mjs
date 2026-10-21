import test from 'node:test';import assert from 'node:assert/strict';
import {draftPersonalizedEmail} from '../../src/lib/outreach/personalized-ai.ts';
const config=await import('../../src/lib/outreach/writing-config.ts').catch(()=>({}));
const research={coverage:'complete',checkedAt:new Date().toISOString(),pageLimit:25,discoveredPages:1,warnings:[],pages:[{url:'https://example.com/services',title:'Lighting',content:'We include seasonal takedown and storage.',truncated:false}]};
const input={prospect:{name:'Example Lights',industry:'Christmas Light Installation',city:'Plano',website:'https://example.com',researchState:'inspected'},findings:[],offerType:'website_plus_seo',senderName:'Neal',research};
const draft={subject:'an idea for your lighting services',body:'Hey there, I noticed seasonal takedown and storage on your site. Want me to send two ideas to make those details easier to find?',reasoning:'Uses a documented service.',sourceUrl:research.pages[0].url,sourceQuote:'seasonal takedown and storage'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const completed=data=>({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private reasoning must not be parsed'},{text:JSON.stringify(data)}]}}]});
test('Gemini configuration takes priority over an existing OpenAI key without exposing credentials',()=>{
 assert.equal(typeof config.writingProvider,'function');
 assert.equal(config.writingProvider({GEMINI_API_KEY:' gemini-fixture ',OPENAI_API_KEY:'openai-fixture'}),'gemini');
 assert.equal(config.writingProvider({GEMINI_API_KEY:' ',OPENAI_API_KEY:'openai-fixture'}),'openai');
 assert.equal(config.writingProvider({}),null);
});
test('Gemini sends researched context with a server header key and parses sourced JSON',async()=>{
 let calls=0;
 const actual=await draftPersonalizedEmail(input,{provider:'gemini',apiKey:'fixture-only',request:async(url,init)=>{
  calls++;assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
  assert.equal(init.headers['x-goog-api-key'],'fixture-only');assert.equal(init.headers.Authorization,undefined);
  const body=JSON.parse(init.body);assert.ok(body.systemInstruction.parts[0].text);assert.ok(body.contents[0].parts[0].text.includes('seasonal takedown and storage'));
  assert.equal(body.generationConfig.responseFormat.text.mimeType,'APPLICATION_JSON');assert.ok(body.generationConfig.responseFormat.text.schema.required.includes('sourceQuote'));
  return json(completed(draft));
 }});
 assert.equal(calls,1);assert.equal(actual.body,draft.body);
});
test('Gemini rejects interrupted, blocked and fabricated-source drafts',async()=>{
 for(const [payload,expected] of [
  [{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(draft)}]}}]},/Gemini.*finish/i],
  [{promptFeedback:{blockReason:'SAFETY'}},/Gemini.*blocked/i],
  [completed({...draft,sourceQuote:'an invented detail about this business'}),/quote|source/i],
 ])await assert.rejects(draftPersonalizedEmail(input,{provider:'gemini',apiKey:'fixture-only',request:async()=>json(payload)}),expected);
});
test('Gemini errors distinguish API credits from quota without exposing raw responses or falling back',async()=>{
 for(const [status,expected] of [[402,/Gemini.*credit|Gemini.*billing/i],[429,/Gemini.*quota|Gemini.*rate limit/i],[403,/Gemini.*key|Gemini.*permission/i]]){
  let calls=0;
  await assert.rejects(draftPersonalizedEmail(input,{provider:'gemini',apiKey:'fixture-only',request:async()=>{calls++;return json({error:{message:'secret-fixture-provider-data'}},status);}}),error=>expected.test(error.message)&&!error.message.includes('secret-fixture'));
  assert.equal(calls,1);
 }
});
test('Gemini refuses a missing key before making a provider request',async()=>{
 await assert.rejects(draftPersonalizedEmail(input,{provider:'gemini',apiKey:'',request:async()=>{throw Error('must not call');}}),/GEMINI_API_KEY/);
});
