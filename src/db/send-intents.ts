import {hasUnresolvedDelivery,canContactProspect} from '@/lib/crm-guards';
import {and,eq,inArray,isNull,sql} from 'drizzle-orm';
import {db} from './index';
import {sendIntents,prospects,messages,sequenceEnrollments,sequences} from './schema';
import {getValidGmailAccessToken} from './connections';
import {sendGmailMessage} from '@/lib/gmail';
import {sendApprovedIntent} from '@/lib/outreach/send-service';
import {advanceSequenceInTransaction,lockSequenceAction} from './sequence-actions';
function conn(){if(!db)throw new Error('Database is not configured');return db;}

type PrepareInput={orgId:string;userId:string;prospectId:string;clientKey:string;recipient:string;subject:string;body:string;enrollmentId?:string;expectedStepPosition?:number};
export async function prepareSend(input:PrepareInput){
 const sender=await getValidGmailAccessToken(input.userId);
 if(!sender?.emailAddress)throw new Error('Connect your personal Gmail account before sending');
 if(Boolean(input.enrollmentId)!==(input.expectedStepPosition!==undefined))throw new Error('Sequence sends require an enrollment and expected step');
 return conn().transaction(async tx=>{
  const [prospect]=await tx.select().from(prospects).where(and(eq(prospects.orgId,input.orgId),eq(prospects.id,input.prospectId))).for('update');
  if(!prospect||!canContactProspect(prospect))throw new Error('Prospect is unavailable for outreach');
  const lookup=input.enrollmentId
   ?and(eq(sendIntents.orgId,input.orgId),eq(sendIntents.enrollmentId,input.enrollmentId),eq(sendIntents.expectedStepPosition,input.expectedStepPosition!),inArray(sendIntents.state,['prepared','sending','unknown','sent']))
   :and(eq(sendIntents.orgId,input.orgId),eq(sendIntents.clientKey,input.clientKey));
  const [prior]=await tx.select().from(sendIntents).where(lookup).limit(1);
  if(prior){
   if(prior.userId!==input.userId||prior.prospectId!==input.prospectId)throw new Error('Message not found');
   if(prior.state==='prepared'&&(prior.recipient!==input.recipient||prior.subject!==input.subject||prior.body!==input.body))throw new Error('This sequence email is already prepared with different wording. Review the saved draft before sending.');
   return {intentId:prior.id,expectedSender:prior.expectedSender,state:prior.state};
  }
  const previous=await tx.select({state:sendIntents.state}).from(sendIntents).where(and(eq(sendIntents.orgId,input.orgId),eq(sendIntents.prospectId,input.prospectId),inArray(sendIntents.state,['sending','unknown'])));
  if(hasUnresolvedDelivery(previous))throw new Error('A previous email has unresolved delivery. Check the sending account in Gmail and reconcile its status before preparing another email.');
  let sequenceStepId:string|undefined;
  if(input.enrollmentId){const action=await lockSequenceAction(tx,input.orgId,input.prospectId,input.enrollmentId,input.expectedStepPosition!);sequenceStepId=action.step.id;}
  const [created]=await tx.insert(sendIntents).values({...input,sequenceStepId,expectedSender:sender.emailAddress!}).onConflictDoNothing().returning();
  if(!created)throw new Error('The draft changed while being prepared. Refresh and review it again.');
  return {intentId:created.id,expectedSender:created.expectedSender,state:created.state};
 });
}

export async function executeSend(input:{orgId:string;userId:string;intentId:string;prospectId:string;expectedSender:string},provider:typeof sendGmailMessage=sendGmailMessage){
 return sendApprovedIntent(input,{
  load:async()=>{
   const [row]=await conn().select({intent:sendIntents,disposition:prospects.outreachDisposition,status:prospects.status}).from(sendIntents).innerJoin(prospects,and(eq(prospects.id,sendIntents.prospectId),eq(prospects.orgId,input.orgId))).where(and(eq(sendIntents.id,input.intentId),eq(sendIntents.orgId,input.orgId),eq(sendIntents.userId,input.userId))).limit(1);
   return row?{...row.intent,outreachDisposition:row.status==='Not Interested'?'not_interested':row.disposition}:null;
  },
  sender:()=>getValidGmailAccessToken(input.userId),
  claim:async()=>conn().transaction(async tx=>{
   const [prospect]=await tx.select().from(prospects).where(and(eq(prospects.id,input.prospectId),eq(prospects.orgId,input.orgId))).for('update');
   if(!prospect||!canContactProspect(prospect))return false;
   const [intent]=await tx.select().from(sendIntents).where(and(eq(sendIntents.id,input.intentId),eq(sendIntents.orgId,input.orgId),eq(sendIntents.userId,input.userId),eq(sendIntents.prospectId,input.prospectId))).limit(1);
   if(!intent||intent.state!=='prepared')return false;
   if(intent.enrollmentId){try{await lockSequenceAction(tx,input.orgId,input.prospectId,intent.enrollmentId,intent.expectedStepPosition!);}catch{return false;}}
   const rows=await tx.update(sendIntents).set({state:'sending',updatedAt:new Date()}).where(and(eq(sendIntents.id,intent.id),eq(sendIntents.state,'prepared'))).returning();
   return rows.length===1;
  }),
  provider:(intent,sender)=>provider({accessToken:sender.accessToken,from:sender.emailAddress,fromName:'Neal Pyles',to:intent.recipient,subject:intent.subject,body:intent.body}),
  record:async result=>conn().transaction(async tx=>{
   await tx.select({id:prospects.id}).from(prospects).where(and(eq(prospects.id,input.prospectId),eq(prospects.orgId,input.orgId))).for('update');
   const [reference]=await tx.select().from(sendIntents).where(and(eq(sendIntents.id,input.intentId),eq(sendIntents.orgId,input.orgId))).limit(1);
   if(!reference)throw new Error('Send intent not found');
   // Delivery is recorded even if the contact was stopped while Gmail was in flight.
   // Advancement checks the locked current prospect/enrollment and never revives it.
   if(reference.enrollmentId)await advanceSequenceInTransaction(tx,input.orgId,reference.enrollmentId,reference.expectedStepPosition!);
   const [intent]=await tx.update(sendIntents).set({state:'sent',providerMessageId:result.id,threadId:result.threadId,updatedAt:new Date()}).where(and(eq(sendIntents.id,input.intentId),eq(sendIntents.orgId,input.orgId),eq(sendIntents.state,'sending'))).returning();
   if(!intent)throw new Error('Send status could not be recorded');
   await tx.insert(messages).values({orgId:input.orgId,prospectId:input.prospectId,direction:'outbound',channel:'email',status:'sent',fromAddress:intent.expectedSender,toAddress:intent.recipient,subject:intent.subject,body:intent.body,sequenceStepId:intent.sequenceStepId,providerMessageId:result.id,threadId:result.threadId,sentAt:new Date()});
   await tx.update(prospects).set({lastContactedAt:new Date(),updatedAt:new Date(),status:sql`CASE WHEN ${prospects.status}='New Lead' THEN 'Email Sent'::prospect_status ELSE ${prospects.status} END`}).where(and(eq(prospects.id,input.prospectId),eq(prospects.orgId,input.orgId)));
  }),
  uncertain:async(error,result)=>{await conn().update(sendIntents).set({state:'unknown',error:error.slice(0,300),providerMessageId:result?.id,threadId:result?.threadId,updatedAt:new Date()}).where(and(eq(sendIntents.id,input.intentId),eq(sendIntents.orgId,input.orgId),eq(sendIntents.state,'sending')));},
 });
}

export async function stopProspectOutreach(orgId:string,prospectId:string,reason:'replied'|'not_interested'|'do_not_contact'){
 await conn().transaction(async tx=>{
  const [prospect]=await tx.update(prospects).set({outreachDisposition:reason,nextFollowUpAt:null,updatedAt:new Date()}).where(and(eq(prospects.id,prospectId),eq(prospects.orgId,orgId))).returning();
  if(!prospect)throw new Error('Prospect not found');
  const owned=tx.select({id:sequences.id}).from(sequences).where(eq(sequences.orgId,orgId));
  await tx.update(sequenceEnrollments).set({pausedAt:new Date(),nextActionAt:null}).where(and(eq(sequenceEnrollments.prospectId,prospectId),inArray(sequenceEnrollments.sequenceId,owned),isNull(sequenceEnrollments.completedAt)));
  await tx.update(sendIntents).set({state:'cancelled',updatedAt:new Date()}).where(and(eq(sendIntents.orgId,orgId),eq(sendIntents.prospectId,prospectId),eq(sendIntents.state,'prepared')));
 });
}
