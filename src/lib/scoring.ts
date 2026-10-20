import {inspectWebsite} from "./research/website-audit";
import type {Quality} from "./pipeline";
export type ScoreResult={quality:Quality;issues:string[];score:number};
export async function checkWebsiteQuality(url:string|undefined|null):Promise<ScoreResult>{
 const audit=await inspectWebsite(url??null);
 if(audit.state==="unavailable")throw new Error(audit.errorCode??"Website could not be inspected");
 if(audit.state==="missing")return {quality:"No Website",issues:["No standalone website found"],score:0};
 const issues=audit.findings.filter(f=>!["canonical_review"].includes(f.code)).map(f=>f.title);
 const score=Math.max(0,100-issues.length*15);
 const quality:Quality=score>=80?"Good":score>=60?"Decent":score>=35?"Outdated":"Terrible";
 return {quality,issues,score};
}
