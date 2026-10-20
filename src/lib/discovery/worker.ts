import {providerSettings} from '@/db/provider-settings';
import {claimSearchUnit,renewSearchLease,completeSearchUnit} from '@/db/discovery';
import {searchGoogle} from './google';
import {searchPublicWeb} from './public-web';
import {inspectWebsite} from '../research/website-audit';
import type {AuditResult,Candidate} from '../crm-types';
export async function processNextSearchUnit(workerId:string):Promise<boolean>{
 const claim=await claimSearchUnit(workerId);if(!claim)return false;
 const {unit,job}=claim;const controller=new AbortController();let renewing=false;
 const timer=setInterval(()=>{if(renewing)return;renewing=true;void renewSearchLease(unit.id,job.id,workerId).then(ok=>{if(!ok)controller.abort();}).catch(()=>controller.abort()).finally(()=>{renewing=false;});},15000);
 const items:{candidate:Candidate;audit:AuditResult|null}[]=[];let warnings:string[]=[];
 try{
  const credentials=await providerSettings(job.orgId);
  const input={city:unit.city,industry:unit.industry,limit:job.config.maxResultsPerQuery};
  const result=unit.source==='google'?await searchGoogle(input,{apiKey:credentials.googleKey},controller.signal):await searchPublicWeb({...input,source:unit.source as 'facebook'|'craigslist'},{apiKey:credentials.publicWebKey},controller.signal);
  warnings=result.warnings;
  for(const candidate of result.candidates){controller.signal.throwIfAborted();const audit=candidate.reviewRequired?null:await inspectWebsite(candidate.website,{signal:controller.signal});items.push({candidate,audit});}
  await completeSearchUnit(unit.id,workerId,items,warnings);
 }catch(error){if(!controller.signal.aborted)await completeSearchUnit(unit.id,workerId,items,warnings,error instanceof Error?error.message:'Source failed');}
 finally{clearInterval(timer);}
 return true;
}
