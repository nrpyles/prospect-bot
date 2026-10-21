import {safeFetchPage} from './safe-fetch.ts';
import type {AuditResult,Finding} from '../crm-types.ts';
import {randomUUID} from 'node:crypto';
const UNMEASURED=['Search rankings and traffic','Search engine indexing','Rendered mobile usability','Performance measurements','Google Business Profile optimization'];
// A bounded static metadata scan, not a browser rendering or comprehensive SEO audit.
function tags(html:string){return [...html.matchAll(/<(?:(?:"[^"]*")|(?:'[^']*')|[^'">])*>/g)].map(m=>{
 const name=m[0].match(/^<\s*([\w-]+)/)?.[1]?.toLowerCase()??'';const attrs:Record<string,string>={};
 for(const a of m[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[a[1].toLowerCase()]=a[2]??a[3]??a[4]??'';
 return {name,attrs};
});}
export function auditHtml(html:string,url:string):AuditResult{
 const cleaned=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
 const ts=tags(cleaned);const findings:Finding[]=[];const now=new Date().toISOString();
 const add=(code:string,title:string,evidence:string,suggestion:string,category:Finding['category']='on_page_seo')=>findings.push({id:randomUUID(),category,code,title,evidence,url,checkedAt:now,confidence:'observed',suggestion});
 const hasMeta=(name:string)=>ts.some(t=>t.name==='meta'&&t.attrs.name?.toLowerCase()===name&&Boolean(t.attrs.content?.trim()));
 if(!/<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(cleaned))add('missing_title','Page title needs attention','No nonempty title was found in the inspected HTML.','Write a descriptive service and location page title.');
 if(!hasMeta('description'))add('missing_description','Search description opportunity','No nonempty meta description was found.','Write a useful summary of the service and area served.');
 if(!ts.some(t=>t.name==='h1'))add('missing_h1','Main heading opportunity','No H1 was found in the inspected HTML.','Add a clear main heading describing the business service.');
 if(!hasMeta('viewport'))add('missing_viewport','Mobile configuration needs review','No viewport metadata was found.','Check the site on a phone and add suitable viewport metadata.','website');
 if(!ts.some(t=>t.name==='form'||t.name==='a'&&/^(tel:|mailto:)|contact|quote|estimate|book/i.test(t.attrs.href??'')))add('contact_path','Contact path needs review','No form or recognizable contact link was found in static HTML.','Make it easy to request a quote; verify rendered widgets separately.','website');
 if(!ts.some(t=>t.name==='link'&&t.attrs.rel?.toLowerCase()==='canonical'))add('canonical_review','Canonical page reference','No canonical link was found on this page.','Review duplicate URL behavior and whether this page needs a canonical URL.');
 const robots=ts.find(t=>t.name==='meta'&&t.attrs.name?.toLowerCase()==='robots')?.attrs.content??'';
 if(/\bnoindex\b/i.test(robots))add('page_noindex','This page requests no indexing',`Page robots directive: ${robots.slice(0,160)}`,'Confirm whether excluding this particular page is intentional.');
 const ld=[...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 for(const x of ld){try{JSON.parse(x[1]);}catch{add('invalid_schema','Structured data syntax needs review','A JSON LD block could not be parsed.','Correct its JSON syntax and validate its business facts.');}}
 return {websiteUrl:url,state:'inspected',findings,checksRun:['Static title','Description','Heading','Contact path','Viewport','Canonical','Robots directives','Structured data syntax'],checksNotRun:[...UNMEASURED]};
}
export async function inspectWebsite(value:string|null,options:{signal?:AbortSignal;page?:{html:string;url:string}}={}):Promise<AuditResult>{
 if(!value?.trim())return {websiteUrl:null,state:'missing',findings:[],checksRun:[],checksNotRun:[...UNMEASURED,'Website HTML']};
 try{
  const url=/^https?:\/\//i.test(value)?value:`https://${value}`;const page=options.page??await safeFetchPage(url,options);const result=auditHtml(page.html,page.url);result.websiteUrl=value;
  const origin=new URL(page.url).origin;const links=new Set<string>();
  for(const t of tags(page.html)){if(t.name!=="a"||!t.attrs.href)continue;try{const u=new URL(t.attrs.href,page.url);u.hash="";if(u.origin===origin&&u.href!==page.url&&/^https?:$/.test(u.protocol))links.add(u.href);}catch{/* malformed href */}if(links.size>=20)break;}
  let checked=0;
  for(const href of [...links].slice(0,4)){try{await safeFetchPage(href,options);checked++;}catch(error){const message=error instanceof Error?error.message:"Not checked";if(/HTTP 404|HTTP 410/.test(message))result.findings.push({id:randomUUID(),category:"website",code:"broken_internal_link",title:"An internal link returned an error",evidence:message,url:href,checkedAt:new Date().toISOString(),confidence:"observed",suggestion:"Update or remove this broken internal link."});else result.checksNotRun.push(`Internal link unavailable: ${href}`);}}
  result.checksRun.push(`Internal links checked: ${checked}`);return result;
 }catch(error){return {websiteUrl:value,state:'unavailable',findings:[],checksRun:[],checksNotRun:[...UNMEASURED,'Website HTML'],errorCode:error instanceof Error?error.message:'Website was not inspected'};}
}
