import type {Candidate} from '../crm-types.ts';
export function standaloneWebsite(value:string|null|undefined):string|null{
 const clean=value?.replace(/^[\s\u200B\uFEFF]+|[\s\u200B\uFEFF]+$/g,'');if(!clean)return null;
 try{if(/^[a-z][a-z0-9+.-]*:/i.test(clean)&&!/^https?:\/\//i.test(clean))return null;const u=new URL(/^https?:\/\//i.test(clean)?clean:`https://${clean}`);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;
 const h=u.hostname.toLowerCase().replace(/^www\./,'');
 if(h!=='sites.google.com'&&['facebook.com','instagram.com','craigslist.org','yelp.com','google.com','maps.app.goo.gl','g.page','nextdoor.com','thumbtack.com','angi.com','homeadvisor.com','bbb.org','linkedin.com','tiktok.com','linktr.ee'].some(d=>h===d||h.endsWith('.'+d)))return null;
 u.hash='';return u.href;
 }catch{return null;}
}
function domain(value:string|null){const url=standaloneWebsite(value);return url?new URL(url).hostname.replace(/^www\./,'').toLowerCase():null;}
export function matchCandidate(candidate:Candidate,existing:Candidate[]):string|null{
 for(const other of existing){
  if(candidate.placeId&&other.placeId){if(candidate.placeId===other.placeId)return other.id;continue;}
  const names=candidate.businessName?.trim().toLowerCase()===other.businessName?.trim().toLowerCase()&&Boolean(candidate.businessName);
  const sameCity=candidate.city.toLowerCase()===other.city.toLowerCase();
  const phone=candidate.phone?.replace(/\D/g,'');const samePhone=Boolean(phone&&phone===other.phone?.replace(/\D/g,''));
  if(names&&(samePhone||sameCity&&domain(candidate.website)&&domain(candidate.website)===domain(other.website)))return other.id;
 }
 return null;
}
export function classifyProvider(value:string):Candidate['providerStatus']{
 if(/any recommendations|looking for (someone|an? |a company)|need (someone|an installer)|who (can|does)|recommend an? /i.test(value))return 'homeowner_request';
 if(/we (offer|install|provide|specialize)|our services|call (us|today|for)|now (booking|accepting)|free (quote|estimate)/i.test(value))return 'provider';
 return 'unknown';
}
