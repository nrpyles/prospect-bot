import test from 'node:test';import assert from 'node:assert/strict';
import * as draft from '../../src/lib/outreach/agency-draft.ts';
import * as guards from '../../src/lib/crm-guards.ts';
const research={coverage:'complete',checkedAt:new Date().toISOString(),pageLimit:50,discoveredPages:2,warnings:[],pages:[{url:'https://example.com/services',title:'Holiday lighting',content:'We install roofline lights and include seasonal takedown and storage.',truncated:false},{url:'https://example.com/about',title:'Our team',content:'Our family business has served Frisco since 2012.',truncated:false}]};
const input={prospect:{name:'Example Lights',industry:'Christmas Light Installation',city:'Frisco',website:'https://example.com',researchState:'inspected'},findings:[],offerType:'website_plus_seo',senderName:'Neal',research};
test('personalized draft context includes service and about content with source URLs',()=>{
 const result=draft.buildAgencyDraftContext(input);const data=JSON.parse(result.user.split('\n').slice(1).join('\n'));
 assert.ok(JSON.stringify(data).includes('seasonal takedown and storage'));
 assert.ok(JSON.stringify(data).includes('https://example.com/about'));
 assert.match(result.system,/40 to 80/);assert.match(result.system,/sourceQuote/);
});
test('personalized output must use a quote from an actually researched page',()=>{
 assert.equal(typeof draft.validatePersonalizedDraft,'function');
 const good={subject:'your lighting services',body:'Hey Example Lights, your site includes seasonal takedown and storage. I help local businesses make those service details easier to find and request a quote from. Would you like me to send a couple of ideas?',sourceUrl:research.pages[0].url,sourceQuote:'seasonal takedown and storage'};
 assert.doesNotThrow(()=>draft.validatePersonalizedDraft(good,research,[]));
 assert.throws(()=>draft.validatePersonalizedDraft({...good,sourceQuote:'We install roofline lights'},research,[]),/source|quote/i);
 assert.throws(()=>draft.validatePersonalizedDraft({...good,sourceUrl:'https://unrelated.example'},research,[]),/source/i);
 assert.throws(()=>draft.validatePersonalizedDraft({...good,sourceQuote:'You are losing hundreds of leads every month.'},research,[]),/source|quote/i);
 assert.throws(()=>draft.validatePersonalizedDraft({...good,body:Array(120).fill('word').join(' ')},research,[]),/short|words/i);
});
test('recent duplicate emails are rejected even if punctuation and case change',()=>{
 assert.equal(typeof draft.validatePersonalizedDraft,'function');
 const body='Hey Example Lights, I saw your team includes lighting takedown and storage. I can help make those details clearer on your service page. Would you like a couple of ideas?';
 assert.throws(()=>draft.validatePersonalizedDraft({subject:'another subject',body:body.toUpperCase(),sourceUrl:research.pages[0].url,sourceQuote:'include seasonal takedown and storage'},research,[{subject:'prior',body}]),/repeat/i);
});
test('refreshing the same website keeps recent draft history without reviving old page content',()=>{
 assert.equal(typeof guards.mergeWebsiteResearch,'function');
 const base={websiteUrl:'https://example.com',state:'inspected',findings:[],checksRun:[],checksNotRun:[]};
 const previous={...base,siteResearch:{...research,recentDrafts:[{subject:'earlier',body:'Earlier message.'}]}};
 const next={...base,siteResearch:{...research,pages:[{url:'https://example.com/new',title:'New service',content:'New business page.',truncated:false}]}};
 const saved=guards.mergeWebsiteResearch(next,previous);
 assert.equal(saved.siteResearch.recentDrafts[0].body,'Earlier message.');
 assert.equal(saved.siteResearch.pages[0].url,'https://example.com/new');
 assert.equal(guards.mergeWebsiteResearch(base,previous).siteResearch.recentDrafts[0].body,'Earlier message.');
 assert.equal(guards.mergeWebsiteResearch({...next,websiteUrl:'https://another.example'},previous).siteResearch.recentDrafts,undefined);
});
