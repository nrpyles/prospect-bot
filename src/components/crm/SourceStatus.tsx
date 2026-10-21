"use client";
import {useEffect,useState} from 'react';
import type {JobSummary} from '@/lib/crm-types';
import {driveSearchJob} from '@/lib/discovery/execution';
import {requestJson} from './api';

export function SourceStatus({job,onRefresh}:{job:JobSummary;onRefresh:()=>void}){
 const [executionError,setExecutionError]=useState('');
 const [attempt,setAttempt]=useState(0);
 const active=['queued','running'].includes(job.state);
 useEffect(()=>{
  if(!active)return;
  const controller=new AbortController();
  setExecutionError('');
  void driveSearchJob(async()=>{
   const result=await requestJson<{job:JobSummary}>(`/api/searches/${job.id}/process`,{method:'POST',signal:AbortSignal.timeout(290000)});
   return result.job.state;
  },onRefresh,controller.signal).catch(error=>{
   if(!controller.signal.aborted)setExecutionError(error instanceof Error?error.message:'Search processing stopped.');
  });
  return()=>controller.abort();
 },[job.id,active,attempt,onRefresh]);
 const progress=job.totalUnits?Math.round(job.completedUnits/job.totalUnits*100):0;
 return <article className='crm-job'>
  <div className='crm-row-between'><div><strong>{new Date(job.createdAt).toLocaleDateString()} search</strong><p className='crm-muted'>{job.completedUnits} of {job.totalUnits} searches checked</p></div><span className={`crm-state crm-state-${job.state}`}>{job.state}</span></div>
  <div className='crm-progress' role='progressbar' aria-label='Search progress' aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{width:`${progress}%`}}/></div>
  <div className='crm-job-numbers'><span><b>{job.foundCount}</b> found</span><span><b>{job.addedCount}</b> added</span><span><b>{job.reviewCount}</b> to review</span></div>
  {active&&<p className='crm-muted'>Keep this page open while searching. Saved results stay here, and reopening this page resumes unfinished searches.</p>}
  {active&&executionError&&<div role='alert' className='crm-alert crm-alert-error'><p>{executionError}</p><button className='crm-text-button' onClick={()=>setAttempt(n=>n+1)}>Resume search</button></div>}
  <div className='crm-source-strip'>{[...new Set(job.sources.map(s=>s.source))].map(s=><span key={s} className={'crm-source crm-source-'+s}>{s}</span>)}</div>
  {job.warnings.length>0&&<details className='crm-job-warnings'><summary>{job.warnings.length} notes to review</summary>{job.warnings.map(w=><p key={w}>{w}</p>)}</details>}
  {active&&<button className='crm-text-button' onClick={()=>void requestJson(`/api/searches/${job.id}/cancel`,{method:'POST'}).then(onRefresh).catch(e=>window.alert(e.message))}>Stop search</button>}
 </article>;
}
