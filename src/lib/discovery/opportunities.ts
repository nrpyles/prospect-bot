import type {AuditResult,OfferType} from '../crm-types.ts';
import type {Quality} from '../pipeline.ts';

export const OPPORTUNITY_FOCUSES={
 website_and_seo:'Website + SEO opportunities',
 no_website:'No standalone website linked',
 website_repairs:'Website improvements',
 seo:'SEO opportunities',
 all:'All businesses',
} as const;
export type OpportunityFocus=keyof typeof OPPORTUNITY_FOCUSES;
export type Opportunity={
 kind:'website_needed'|'website_repairs'|'seo'|'review'|'none';
 score:number;label:string;reasons:string[];nextAction:string;offerType:OfferType|null;quality:Quality|null;seoEligible?:boolean;
};
type Business={website?:string|null;googlePlaceId?:string|null};
const SIGNALS:Record<string,{score:number;reason:string;website?:boolean}>={
 page_noindex:{score:70,reason:'The inspected page asks search engines not to index it.'},
 broken_internal_link:{score:55,reason:'An internal website link returned a 404 or 410 response.',website:true},
 contact_path:{score:55,reason:'No contact or quote link was found in the inspected HTML.',website:true},
 missing_viewport:{score:45,reason:'Mobile viewport settings were missing from the inspected HTML.',website:true},
 missing_title:{score:40,reason:'The inspected HTML has no descriptive page title.'},
};

/** A fit shortlist from observed checks, never a ranking, traffic or visual-design score. */
export function assessOpportunity(audit:AuditResult|null,business:Business):Opportunity{
 const base:Opportunity={kind:'review',score:0,label:'Needs verification',reasons:[],nextAction:'Research this business before choosing an offer.',offerType:null,quality:null};
 if(!audit)return base;
 if(audit.state==='missing'&&!business.website)return {...base,kind:'website_needed',score:90,label:'Website to verify',quality:'No Website',offerType:'website_build',
  reasons:[business.googlePlaceId?'No standalone business website is linked from the Google listing.':'No standalone business website is saved for this prospect.'],
  nextAction:'Check the business name and city on Google to confirm whether it already has a website before offering a build.'};
 if(audit.state==='unavailable'){
  if(/^Website returned HTTP (404|410)$/.test(audit.errorCode??''))return {...base,kind:'website_repairs',score:95,label:'Broken website link',quality:'Terrible',offerType:'website_refresh',reasons:['The listed website returned a 404 or 410 response.'],nextAction:'Open the listed website to confirm the broken link and offer help restoring the page.'};
  return {...base,reasons:['The website could not be inspected. Its condition is unverified.'],nextAction:'Check the website manually. A blocked or timed out page does not establish a website problem.'};
 }
 if(audit.state!=='inspected')return base;
 const codes=new Set(audit.findings.filter(f=>f.confidence==='observed').map(f=>f.code));
 const signals=Object.entries(SIGNALS).filter(([code])=>codes.has(code)).map(([,signal])=>signal);
 if(codes.has('missing_h1')&&codes.has('missing_description'))signals.push({score:35,reason:'The inspected HTML lacks a main heading and a search description.'});
 if(!signals.length)return {...base,kind:'none',label:'No clear need found',quality:'Good',reasons:['These limited checks found no qualifying website or SEO issue.'],nextAction:'Review manually if you have another documented reason to offer help.'};
 signals.sort((a,b)=>b.score-a.score);
 const website=signals.some(s=>s.website),seo=signals.some(s=>!s.website);const score=Math.min(85,signals[0].score+(signals.length-1)*5);
 return {kind:website?'website_repairs':'seo',score,label:website?'Website improvement':'SEO improvement',reasons:signals.map(s=>s.reason),
  seoEligible:seo,offerType:website?(seo?'website_plus_seo':'website_refresh'):'seo_improvements',quality:score>=65?'Terrible':'Outdated',
  nextAction:website?'Verify the customer experience in a browser, then offer help with the observed issue.':'Review the observed page issue. Google rankings, traffic and actual indexing have not been measured.'};
}
export function matchesOpportunity(opportunity:Opportunity,focus:OpportunityFocus):boolean{
 if(focus==='all')return true;
 if(focus==='website_and_seo')return ['website_needed','website_repairs','seo'].includes(opportunity.kind);
 if(focus==='seo')return opportunity.kind==='seo'||opportunity.seoEligible===true;
 return opportunity.kind===(focus==='no_website'?'website_needed':focus);
}
export function prioritizeSearchItems<T extends {candidate:{website?:string|null;placeId?:string|null};audit:AuditResult|null}>(items:readonly T[]):T[]{
 return items.map(item=>({item,score:assessOpportunity(item.audit,{website:item.candidate.website,googlePlaceId:item.candidate.placeId}).score})).sort((a,b)=>b.score-a.score).map(x=>x.item);
}
export function refreshSuggestedFields(current:{offerType?:string|null;nextAction?:string|null},previous:Opportunity|null,next:Opportunity|null):{offerType?:OfferType|null;nextAction?:string|null}{
 const patch:{offerType?:OfferType|null;nextAction?:string|null}={};
 if(!current.offerType||previous&&current.offerType===previous.offerType)patch.offerType=next?.offerType??null;
 if(!current.nextAction||previous&&current.nextAction===previous.nextAction)patch.nextAction=next?.nextAction??null;
 return patch;
}
