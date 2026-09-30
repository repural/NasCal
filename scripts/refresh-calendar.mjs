import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateCalendar} from './calendar-refresh-utils.mjs';
import {sources,parseIcs,parseRss,compareEvents} from './official-calendar-collector.mjs';
const mode=process.argv.find(a=>a.startsWith('--mode='))?.split('=')[1]??'daily';
assert(['daily','monthly','validate'].includes(mode),'Unknown refresh mode');
const current=validateCalendar(JSON.parse(fs.readFileSync('data/calendar-live.json','utf8')));
if(mode==='validate'){console.log(`Validated ${current.events.length} events`);process.exit(0);}
const now=new Date(),asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const endDate=new Date(new Date(asOf+'T12:00:00Z').getTime()+90*86400000).toISOString().slice(0,10);
const path='history/calendar-refresh/official-review.json';
const prior=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):null;
const reports=[],observations=[],announcements=[];
for(const source of sources){
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await fetch(source.url,{headers:{'User-Agent':'NasCal official-source monitor','Accept':'text/calendar, application/rss+xml, text/html;q=0.8'},signal:AbortSignal.timeout(30000)});
      assert(response.ok,`HTTP ${response.status}`);const body=await response.text();
      if(source.kind==='ics'){
        const parsed=parseIcs(body,source);assert(parsed.length,'Empty feed');
        const relevant=parsed.filter(e=>e.date>=asOf&&e.date<=endDate);observations.push(...relevant);
        const latestDate=parsed.map(e=>e.date).sort().at(-1);
        reports.push({...source,status:latestDate<asOf?'stale':'ok',latestDate,count:relevant.length});
      }else if(source.kind==='rss'){
        const parsed=parseRss(body,source);const recent=parsed.filter(e=>{const t=Date.parse(e.publishedAt);return Number.isFinite(t)&&t>=now.getTime()-7*86400000&&t<=now.getTime();});
        announcements.push(...recent);reports.push({...source,status:'ok',count:recent.length});
      }else{assert(/Flash.*US PMI|Flash US PMI/i.test(body),'PMI schedule not readable');reports.push({...source,status:'manual-review',reason:'Date extraction requires a verified review; no dates inferred.'});}
      lastError=null;break;
    }catch(e){lastError=e.message;if(attempt<2)await new Promise(r=>setTimeout(r,500*2**attempt));}
  }
  if(lastError)reports.push({...source,status:'unavailable',reason:lastError});
}
const comparisons=compareEvents(observations,current,prior?.sourceObservationHistory??prior?.observations??[]);
const nextPmi=current.events.filter(e=>e.date>=asOf&&e.date<=endDate&&/FLASH PMI/i.test(e.short)&&e.status!=='cancelled').sort((a,b)=>a.date.localeCompare(b.date))[0];
const report={schemaVersion:1,checkedAt:now.toISOString(),asOf,horizonEnd:endDate,mode,sources:reports,observations,sourceObservationHistory:[...observations,...(prior?.sourceObservationHistory??prior?.observations??[]).filter(o=>!reports.some(r=>r.key===o.sourceKey&&r.status==='ok'))],proposals:comparisons.filter(e=>e.action!=='confirmed'),announcements,nextFlashPmi:{calendarEntryId:nextPmi?.id??null,date:nextPmi?.date??null,timeET:nextPmi?.timeLabel??null,officialDateVerified:false,requiresReview:true},publicationStatus:'awaiting-research-review',reviewInstructions:'ChatGPT calendar tasks: read this report, verify proposals and news; explicitly verify next Flash US PMI at 09:45 ET. Before any calendar/HTML publication re-evaluate ALL displayed Market expects, Nasdaq prefers, and Main risk fields with current sources. Preserve historical results, stable entities, design and navigation. Never infer cancellations from absence or label these machine checks as completed market research.'};
fs.mkdirSync('history/calendar-refresh',{recursive:true});fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
const summary=`API-free collection: ${observations.length} upcoming source entries; ${report.proposals.length} review proposals; ${announcements.length} recent Fed announcements. ${reports.filter(s=>s.status!=='ok').length} sources need review. Published calendar retained pending researched interpretations.`;
console.log(summary);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
assert(reports.some(s=>s.status==='ok'),'All official feeds failed or were stale; review report saved, calendar unchanged');
