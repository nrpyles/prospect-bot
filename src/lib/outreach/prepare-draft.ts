import {auditMatchesWebsite} from '../crm-guards.ts';
import type {AuditResult} from '../crm-types.ts';

export async function prepareDraftProspect<T extends {website?:string}>(saved:T,research:AuditResult|null,inspect:()=>Promise<T>,now=Date.now()):Promise<T>{
 const checkedAt=Date.parse(research?.siteResearch?.checkedAt??'');
 const fresh=research&&auditMatchesWebsite(research,saved.website)&&research.siteResearch?.pages.length&&Number.isFinite(checkedAt)&&now>=checkedAt&&now-checkedAt<=7*86400000;
 return saved.website&&!fresh?await inspect():saved;
}
