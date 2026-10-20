import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {checkServerIdentity} from 'node:tls';
export function isPublicAddress(ip:string):boolean{
 if(isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);}
 if(isIP(ip)===6){const x=ip.toLowerCase();return /^2[0-9a-f]{3}:/.test(x)&&!x.startsWith('2001:db8:')&&!x.startsWith('2001:0:')&&!x.startsWith('2002:');}
 return false;
}
export function validatePublicUrl(value:string):URL{
 const u=new URL(value);
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port))throw new Error('Unsafe website URL');
 const host=u.hostname.replace(/^\[|\]$/g,'');
 if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||isIP(host)&&!isPublicAddress(host))throw new Error('Private network targets are blocked');
 return u;
}
type Address={address:string;family:number};
type PageResponse={status:number;location?:string;html:string};
export type FetchPolicy={resolve:(host:string)=>Promise<Address[]>;request:(url:URL,address:Address,signal:AbortSignal)=>Promise<PageResponse>};
export async function requestPinned(url:URL,address:Address,signal:AbortSignal):Promise<PageResponse>{
 return new Promise((resolve,reject)=>{
  const hostname=url.hostname.replace(/^\[|\]$/g,'');
  const req=(url.protocol==='https:'?httpsRequest:httpRequest)({hostname:address.address,family:address.family,port:url.port||undefined,path:url.pathname+url.search,method:'GET',agent:false,signal,
   ...(url.protocol==='https:'?{servername:isIP(hostname)?undefined:hostname,checkServerIdentity:(_name,cert)=>checkServerIdentity(hostname,cert)}:{}),
   headers:{Host:url.host,'User-Agent':'FunnelCloserResearch/1.0','Accept':'text/html,application/xhtml+xml','Accept-Encoding':'identity'}},res=>{
    const status=res.statusCode??0;
    if(status>=300&&status<400){res.destroy();resolve({status,location:res.headers.location,html:''});return;}
    if(status<200||status>=300){res.destroy();resolve({status,html:''});return;}
    if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();reject(new Error('Compressed page was not inspected'));return;}
    if(!/text\/html|application\/xhtml/i.test(res.headers['content-type']??'')){res.destroy();reject(new Error('Website did not return HTML'));return;}
    let size=0;const chunks:Buffer[]=[];
    res.on('data',(c:Buffer)=>{size+=c.length;if(size>1048576){res.destroy(new Error('Page exceeds 1 MiB limit'));return;}chunks.push(c);});
    res.on('end',()=>resolve({status,html:Buffer.concat(chunks).toString('utf8')}));res.on('error',reject);
   });req.on('error',reject);req.end();
 });
}
const defaultPolicy:FetchPolicy={resolve:host=>lookup(host,{all:true,verbatim:true}),request:requestPinned};
export async function safeFetchPage(value:string,options:{signal?:AbortSignal;policy?:FetchPolicy}={}):Promise<{url:string;html:string;status:number}>{
 const signal=AbortSignal.any([AbortSignal.timeout(10000),...(options.signal?[options.signal]:[])]);
 const policy=options.policy??defaultPolicy;let url=validatePublicUrl(value);
 for(let redirects=0;redirects<=3;redirects++){
  signal.throwIfAborted();const host=url.hostname.replace(/^\[|\]$/g,'');
  const addresses=await Promise.race([policy.resolve(host),new Promise<never>((_,reject)=>{signal.addEventListener('abort',()=>reject(new Error('Website request timed out')),{once:true});})]);
  if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error('Private or unknown network destination');
  signal.throwIfAborted();const response=await policy.request(url,addresses[0],signal);
  if(response.status>=300&&response.status<400&&response.location){url=validatePublicUrl(new URL(response.location,url).href);continue;}
  if(response.status<200||response.status>=300)throw new Error(`Website returned HTTP ${response.status}`);
  if(Buffer.byteLength(response.html)>1048576)throw new Error('Page exceeds 1 MiB limit');
  return {url:url.href,html:response.html,status:response.status};
 }
 throw new Error('Website exceeded redirect limit');
}
