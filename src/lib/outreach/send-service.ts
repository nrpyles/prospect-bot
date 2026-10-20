import type {SendIntentState} from '../crm-types.ts';
export type IntentRecord={id:string;orgId:string;userId:string;prospectId:string;expectedSender:string;recipient:string;subject:string;body:string;state:string;outreachDisposition:string;providerMessageId?:string|null};
export type IntentInput={intentId:string;orgId:string;userId:string;prospectId:string;expectedSender:string};
export type SendDependencies={load:()=>Promise<IntentRecord|null>;sender:()=>Promise<{emailAddress:string|null;accessToken:string}|null>;claim:()=>Promise<boolean>;
 provider:(intent:IntentRecord,sender:{emailAddress:string;accessToken:string})=>Promise<{id:string;threadId:string}>;
 record:(result:{id:string;threadId:string})=>Promise<void>;uncertain:(message:string,result?:{id:string;threadId:string})=>Promise<void>};
export async function sendApprovedIntent(input:IntentInput,deps:SendDependencies):Promise<{state:SendIntentState;providerMessageId?:string}>{
 const intent=await deps.load();
 if(!intent||intent.id!==input.intentId||intent.orgId!==input.orgId||intent.userId!==input.userId||intent.prospectId!==input.prospectId)throw new Error('Send intent not found');
 if(intent.state==='sent')return {state:'sent',providerMessageId:intent.providerMessageId??undefined};
 if(['sending','unknown','cancelled','failed'].includes(intent.state))return {state:intent.state as SendIntentState};
 if(intent.outreachDisposition!=='active')throw new Error('Outreach is paused for this prospect');
 const sender=await deps.sender();
 if(!sender?.emailAddress||sender.emailAddress.toLowerCase()!==intent.expectedSender.toLowerCase()||input.expectedSender.toLowerCase()!==intent.expectedSender.toLowerCase())throw new Error('The connected sender changed. Review and prepare the message again.');
 if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(intent.recipient)||/[\r\n]/.test(intent.subject)||/[\r\n]/.test(sender.emailAddress))throw new Error('Invalid message headers');
 if(!await deps.claim())return {state:'sending'};
 let accepted:{id:string;threadId:string}|undefined;
 try{accepted=await deps.provider(intent,{...sender,emailAddress:sender.emailAddress});if(!accepted?.id)throw new Error('The email provider did not confirm delivery');await deps.record(accepted);return {state:'sent',providerMessageId:accepted.id};}
 catch(error){const message=error instanceof Error?error.message:'Message status could not be confirmed';try{await deps.uncertain(message,accepted);}catch{/* The sending state still prevents a retry when storage is unavailable. */}return {state:'unknown',providerMessageId:accepted?.id};}
}
