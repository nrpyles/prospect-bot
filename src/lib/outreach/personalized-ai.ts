import {buildAgencyDraftContext,validatePersonalizedDraft} from './agency-draft.ts';

type Input=Parameters<typeof buildAgencyDraftContext>[0];
type Options={apiKey?:string;request?:typeof fetch};
const MODEL='gpt-6.1-sol';
const properties=Object.fromEntries(['subject','body','reasoning','sourceUrl','sourceQuote'].map(key=>[key,{type:'string'}]));

async function responseJson(response:Response):Promise<unknown>{
 if(!response.body)throw new Error('OpenAI returned no response data');
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2097152)throw new Error('OpenAI response exceeded the transport limit');chunks.push(value);}}
 finally{await reader.cancel().catch(()=>{});}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Error('OpenAI returned invalid response data');}
}
const record=(value:unknown):Record<string,unknown>|null=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;

export async function draftPersonalizedEmail(input:Input,options:Options={}){
 const apiKey=(options.apiKey??process.env.OPENAI_API_KEY)?.trim();
 if(!apiKey)throw new Error('OpenAI writing is not configured. Add OPENAI_API_KEY in your deployment settings.');
 const context=buildAgencyDraftContext(input);
 const response=await (options.request??fetch)('https://api.openai.com/v1/responses',{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(90000),
  headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
  body:JSON.stringify({model:MODEL,instructions:context.system,input:context.user,store:false,reasoning:{effort:'medium'},max_output_tokens:8192,text:{format:{type:'json_schema',name:'outreach_email',strict:true,schema:{type:'object',properties,required:Object.keys(properties),additionalProperties:false}}}})
 }).catch(()=>{throw new Error('OpenAI writing could not connect or timed out. Try again.');});
 if(!response.ok){
  await response.body?.cancel();
  if(response.status===401||response.status===403)throw new Error('OpenAI rejected the connection. Check the server API key and project permissions.');
  if(response.status===404)throw new Error('The OpenAI writing model is unavailable to this API project. Check model access.');
  if(response.status===429)throw new Error('OpenAI could not process this draft. Check API billing, credits and rate limits.');
  throw new Error(`OpenAI writing returned HTTP ${response.status}. Try again.`);
 }
 const result=record(await responseJson(response));
 if(!result||result.status!=='completed')throw new Error('OpenAI did not finish the draft. Its provider output limit or another interruption may have been reached. Try again.');
 const texts:string[]=[];
 for(const item of Array.isArray(result.output)?result.output:[]){
  const message=record(item);if(message?.type!=='message')continue;
  for(const item of Array.isArray(message.content)?message.content:[]){
   const block=record(item);if(block?.type==='refusal')throw new Error('OpenAI declined this draft. Review the business research before trying again.');
   if(block?.type==='output_text'&&typeof block.text==='string')texts.push(block.text);
  }
 }
 let data:Record<string,unknown>|null;
 try{data=record(JSON.parse(texts.join('')));}catch{throw new Error('OpenAI did not return a valid email. Generate another version.');}
 if(!data||typeof data.subject!=='string'||typeof data.body!=='string'||!data.subject.trim()||!data.body.trim())throw new Error('OpenAI returned an empty or invalid email');
 const draft={subject:data.subject.trim(),body:data.body.trim(),reasoning:typeof data.reasoning==='string'?data.reasoning:'',sourceUrl:typeof data.sourceUrl==='string'&&data.sourceUrl?data.sourceUrl:undefined,sourceQuote:typeof data.sourceQuote==='string'&&data.sourceQuote?data.sourceQuote:undefined};
 if(input.research?.pages.length)validatePersonalizedDraft(draft,input.research,input.research.recentDrafts??[]);
 if(/[—–]|\s-\s/.test(draft.body+' '+draft.subject))throw new Error('The AI draft needs simpler punctuation. Generate another version.');
 return draft;
}
