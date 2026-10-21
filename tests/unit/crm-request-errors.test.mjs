import test from 'node:test';import assert from 'node:assert/strict';
import {requestJson} from '../../src/components/crm/api.ts';

test('a shared invalid URL response identifies the action that actually failed',async t=>{
 const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
 globalThis.fetch=async()=>new Response(JSON.stringify({error:'Invalid URL'}),{status:400,headers:{'Content-Type':'application/json'}});
 for(const [path,method,label] of [['/api/prospects/example','PATCH',/saving business details/i],['/api/prospects/example/research','POST',/researching the website/i],['/api/prospects/example/draft','POST',/writing the email/i]]){
  await assert.rejects(requestJson(path,{method}),error=>label.test(error.message)&&error.message.includes('Invalid URL'));
 }
});
