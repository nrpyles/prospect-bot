import type {Prospect} from './mock-prospects.ts';
export type CrmFilters=Partial<Record<'search'|'city'|'industry'|'source'|'websiteState'|'offerType'|'status',string>>;
export function businessDay(now=new Date()):string{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dueProspects(prospects:Prospect[],now=new Date()):Prospect[]{const day=businessDay(now);return prospects.filter(p=>p.nextFollowUpAt&&p.nextFollowUpAt.slice(0,10)<=day&&(p.outreachDisposition??'active')==='active'&&!['Closed Won','Closed Lost','Not Interested'].includes(p.status)).sort((a,b)=>a.nextFollowUpAt!.localeCompare(b.nextFollowUpAt!));}
export function filterProspects(items:Prospect[],f:CrmFilters):Prospect[]{return items.filter(p=>{
 if(f.search&&!`${p.name} ${p.city} ${p.ownerName??''} ${p.industry}`.toLowerCase().includes(f.search.toLowerCase()))return false;
 return (!f.city||p.city===f.city)&&(!f.industry||p.industry===f.industry)&&(!f.source||p.source===f.source)&&(!f.websiteState||(p.researchState??'unchecked')===f.websiteState)&&(!f.offerType||p.offerType===f.offerType)&&(!f.status||p.status===f.status);
});}
export function externalUrl(value:string|undefined|null):string|undefined{
 try{
  const clean=value?.replace(/^[\s\u200B\uFEFF]+|[\s\u200B\uFEFF]+$/g,'');if(!clean)return undefined;
  if(/^[a-z][a-z0-9+.-]*:/i.test(clean)&&!/^https?:\/\//i.test(clean))return undefined;
  const u=new URL(/^https?:\/\//i.test(clean)?clean:`https://${clean}`);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return undefined;
  return u.href;
 }catch{return undefined;}
}
