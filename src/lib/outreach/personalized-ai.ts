import Anthropic from '@anthropic-ai/sdk';
import {buildAgencyDraftContext,validatePersonalizedDraft} from './agency-draft';

type Input=Parameters<typeof buildAgencyDraftContext>[0];
export async function draftPersonalizedEmail(input:Input){
 const apiKey=process.env.ANTHROPIC_API_KEY;if(!apiKey)throw new Error('AI drafting is not configured');
 const context=buildAgencyDraftContext(input);
 const client=new Anthropic({apiKey,timeout:90000,maxRetries:0});
 const response=await client.messages.create({model:'claude-sonnet-4-6',max_tokens:1000,system:context.system,messages:[{role:'user',content:context.user}]});
 const content=response.content.find(block=>block.type==='text');
 if(!content||content.type!=='text')throw new Error('The AI returned no email text. Generate another version.');
 let parsed:unknown;
 try{parsed=JSON.parse(content.text.trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,''));}catch{throw new Error('The AI did not return a valid email. Generate another version.');}
 if(!parsed||typeof parsed!=='object')throw new Error('The AI returned an invalid email');
 const data=parsed as Record<string,unknown>;
 if(typeof data.subject!=='string'||typeof data.body!=='string'||!data.subject.trim()||!data.body.trim())throw new Error('The AI returned an empty email');
 const draft={subject:data.subject.trim(),body:data.body.trim(),reasoning:typeof data.reasoning==='string'?data.reasoning:'',sourceUrl:typeof data.sourceUrl==='string'?data.sourceUrl:undefined,sourceQuote:typeof data.sourceQuote==='string'?data.sourceQuote:undefined};
 if(input.research?.pages.length)validatePersonalizedDraft(draft,input.research,input.research.recentDrafts??[]);
 if(/[—–]|\s-\s/.test(draft.body+' '+draft.subject))throw new Error('The AI draft needs simpler punctuation. Generate another version.');
 return draft;
}
