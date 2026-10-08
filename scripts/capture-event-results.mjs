import fs from 'node:fs/promises';
import {resolveEventFamily} from '../data/event-family.mjs';
import {timestamp} from './market-reaction-utils.mjs';
import {etParts,releaseTimestamp,windowState,indexMeasurement,parseOutcome,parseMarketWatchOutcome} from './result-capture-utils.mjs';
const now=Date.now(),parts=etParts(now),today=`${parts.year}-${parts.month}-${parts.day}`;
const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await fs.readFile(new URL(path,root),'utf8'));
const archive=await read('history/event-results.json'),feed=await read('data/calendar-live.json'),reviewed=await read('history/release-outcomes.json');
const archivedEvents=Object.entries(archive.eventIndex).map(([id,i])=>({id,date:i.eventDate,eventKey:i.eventKey,type:i.eventType,timeLabel:/^\d\d:\d\d$/.test(i.timeET??'')?`${i.timeET} ET`:i.timeET,status:'scheduled'}));
const events=[...new Map([...archivedEvents,...(feed.recentEvents??[]),...feed.events].map(e=>[e.id,e])).values()];
const map=new Map(archive.results.map(r=>[r.eventId,r])),report={checkedAt:new Date(now).toISOString(),issues:[],requests:0};
const cutoff=new Date(now-10*86400000).toISOString().slice(0,10);
for(const e of events){
  if(e.status==='cancelled')continue;
  const old=archive.eventIndex[e.id];
  const time=e.timeLabel?.match(/(\d\d:\d\d) ET/)?.[1]??(e.type==='Earnings'?'after-close':'headline-driven');
  archive.eventIndex[e.id]??={eventDate:e.date,eventKey:resolveEventFamily(e)??e.id,eventType:e.type,importance:e.importance,timeET:time,surpriseDirection:'unassessed',nasdaqReactionDirection:'unverified',dominantDriver:resolveEventFamily(e)??e.short,confounders:[]};
  if(!map.has(e.id)){const r={eventId:e.id,status:'pending',expected:e.expects,previous:null,actual:null,surprise:null,sourceUrl:null};archive.results.push(r);map.set(e.id,r);}
  const r=map.get(e.id),verified=reviewed.outcomes[e.id];
  for(const field of ['previous','actual','surprise'])r[field]??=null;
  r.missingFields=Object.fromEntries(['previous','expected','actual','surprise'].filter(f=>r[f]==null).map(f=>[f,{status:'awaiting-verification'}]));
  if(e.date<=today){
    r.indexLevels??={};r.capture??={};
    for(const name of ['nasdaq','sox']){
      const l=r.indexLevels[name]??={},s=r.capture[name]??={};
      for(const field of ['priorClose','beforeRelease','at15','at60','dayClose'])l[field]??=null;
      s.priorClose=l.priorClose?.value?'captured':'missing';
      s.dayClose=l.dayClose?.value?'captured':now>=timestamp(e.date,'16:15')?'missing':'pending';
      for(const [f,m] of [['at15',15],['at60',60]])s[f]=l[f]?.close?'captured':windowState(archive.eventIndex[e.id],m,now)==='due'?'missing':windowState(archive.eventIndex[e.id],m,now);
    }
  }
  if(verified&&r.status!=='verified'){
    Object.assign(r,verified,{status:'verified',outcomeStatus:'verified',surprise:r.surprise??'No verified contemporaneous consensus; surprise not calculated.',explanation:r.explanation??'Outcome verified. Observed price changes may reflect overlapping catalysts; no isolated causal attribution.'});
    r.auditNotes??=[];r.auditNotes.push({at:reviewed.outcomes[e.id].verifiedAt,action:'Official outcome verified; existing price and earnings windows preserved.'});
  }
}
const key=process.env.MASSIVE_API_KEY,cache=new Map();let lastRequest=0;
const fallbackUrl='https://www.marketwatch.com/economy-politics/calendar';let marketWatchPage;
async function fallbackOutcome(e){
  marketWatchPage??=fetch(fallbackUrl,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'NasCal economic result verification'}}).then(async response=>{if(!response.ok)throw Error(`MarketWatch HTTP ${response.status}`);return response.text();});
  const result=parseMarketWatchOutcome(await marketWatchPage,e.date,resolveEventFamily(e),today);
  if(!result)throw Error('No unambiguous dated MarketWatch actual; retry retained');return result;
}
async function request(url){
  const wait=13000-(Date.now()-lastRequest);if(wait>0)await new Promise(r=>setTimeout(r,wait));lastRequest=Date.now();report.requests++;
  const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const body=await response.json();if(!['OK','DELAYED'].includes(body.status)||body.next_url)throw Error('Incomplete aggregates');return body.results??[];
}
async function bars(ticker,date,resolution){
  const id=`${ticker}/${date}/${resolution}`;
  if(!cache.has(id))cache.set(id,request(`https://api.massive.com/v2/aggs/ticker/${ticker}/range/1/${resolution}/${resolution==='day'?new Date(Date.parse(date+'T12:00:00Z')-10*86400000).toISOString().slice(0,10):date}/${date}?sort=asc&limit=5000&adjusted=true`));
  return cache.get(id);
}
function sourceFor(e){
  const d=new Date(e.date+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-1,1);const month=d.toLocaleString('en-US',{month:'long',timeZone:'UTC'}).toLowerCase();
  const family=resolveEventFamily(e);
  if(family==='employment-report')return 'https://www.bls.gov/news.release/empsit.nr0.htm';
  if(family==='cpi')return 'https://www.bls.gov/news.release/cpi.nr0.htm';
  if(family==='ppi')return 'https://www.bls.gov/news.release/ppi.nr0.htm';
  if(family==='core-pce')return `https://www.bea.gov/news/${d.getUTCFullYear()}/personal-income-and-outlays-${month}-${d.getUTCFullYear()}`;
  if(family?.startsWith('gdp-'))return 'https://www.bea.gov/data/gdp/gross-domestic-product';
  if(family==='ism-manufacturing'||family==='ism-services')return `https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/${family==='ism-services'?'services':'pmi'}/${month}/`;
  return null;
}
// Missing history stays eligible after it leaves the visible calendar. Rotate work
// by last attempt and bound each run to fit the free API's rate limit.
const candidates=events.filter(e=>!process.env.CAPTURE_SEED_ONLY&&e.date<=today&&e.status!=='cancelled').filter(e=>{
  const r=map.get(e.id),i=archive.eventIndex[e.id];
  return r.status!=='verified'||['nasdaq','sox'].some(name=>{
    const l=r.indexLevels?.[name];
    return !l?.priorClose?.value||!l?.dayClose?.value||(['at15','at60'].some((f,n)=>!l?.[f]?.close&&windowState(i,n===0?15:60,now)==='due'));
  });
}).sort((a,b)=>(map.get(a.id).captureAttemptAt??'').localeCompare(map.get(b.id).captureAttemptAt??'')||b.date.localeCompare(a.date)).slice(0,8);
for(const e of candidates){
  const r=map.get(e.id),i=archive.eventIndex[e.id],release=releaseTimestamp(i);
  if(release!==null&&now<release)continue;
  r.capture??={};r.captureAttemptAt=new Date(now).toISOString();
  if(r.status!=='verified'&&(!r.outcomeRetryAt||Date.parse(r.outcomeRetryAt)<=now)){
    const url=sourceFor(e);
    try{
      if(!url)throw Error('Official outcome requires researched review; no deterministic adapter for this event.');
      const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`Official source HTTP ${response.status}`);
      const text=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ');
      const parsed=parseOutcome(resolveEventFamily(e),text,e.date);if(!parsed)throw Error('Published date or supported outcome fields could not be verified.');
      Object.assign(r,{status:'verified',outcomeStatus:'verified',actual:parsed.actual,sourceUrl:url,verifiedAt:new Date(now).toISOString(),outcomeMetrics:{...parsed.metrics,sourceUrl:url}});
    }catch(error){
      try{
        const parsed=await fallbackOutcome(e);
        Object.assign(r,{status:'verified',outcomeStatus:'verified',actual:parsed.actual,sourceUrl:fallbackUrl,sourceType:'secondary-calendar',verifiedAt:new Date(now).toISOString(),outcomeMetrics:{...parsed.metrics,sourceUrl:fallbackUrl}});
        if(r.previous==null&&parsed.previous!=null)r.previous=parsed.previous;
        if(parsed.expected!=null)r.expected=parsed.expected;
        r.auditNotes??=[];r.auditNotes.push({at:new Date(now).toISOString(),action:'MarketWatch dated Actual fallback captured',primarySourceError:error.message,sourceUrl:fallbackUrl});
        delete r.outcomeError;delete r.outcomeRetryAt;
      }catch(fallbackError){r.outcomeStatus='awaiting-verification';r.outcomeError=error.message+'; '+fallbackError.message;r.outcomeRetryAt=new Date(now+30*60000).toISOString();}
    }
  }
  for(const [name,ticker] of [['nasdaq','I:COMP'],['sox','I:SOX']]){
    r.indexLevels??={};const l=r.indexLevels[name]??={};const state=r.capture[name]??={};
    for(const field of ['priorClose','beforeRelease','at15','at60','dayClose'])l[field]??=null;
    state.priorClose=l.priorClose?.value?'captured':'missing';
    state.dayClose=l.dayClose?.value?'captured':now>=timestamp(e.date,'16:15')?'missing':'pending';
    for(const [field,minutes] of [['at15',15],['at60',60]])state[field]=l[field]?.close?'captured':windowState(i,minutes,now)==='due'?'missing':windowState(i,minutes,now);
    l.sourceUrl='https://massive.com/docs/rest/indices/aggregates/custom-bars';l.releaseTimeET=i.timeET;l.releaseLabel=i.eventKey;
    // Migrate older minute-only denials without delaying daily close capture.
    if(state.error?.includes('403')&&l.intradayStatus==='plan-not-authorized'&&!state.minuteRetryAt){state.minuteRetryAt=state.retryAt;delete state.retryAt;}
    if(state.retryAt&&Date.parse(state.retryAt)>now)continue;
    let stage='day';
    try{
      if(!key)throw Error('MASSIVE_API_KEY is missing');
      const closeDue=now>=timestamp(e.date,'16:15');
      if(!l.priorClose?.value||(closeDue&&!l.dayClose?.value)){
        const rows=await bars(ticker,e.date,'day');
        const daily=rows.filter(b=>Number.isFinite(b.c)).map(b=>({date:new Date(b.t).toISOString().slice(0,10),value:b.c}));
        const prior=daily.filter(b=>b.date<e.date).at(-1);if(prior&&!l.priorClose?.value)l.priorClose=prior;
        const close=daily.find(b=>b.date===e.date);if(closeDue&&close&&!l.dayClose?.value)l.dayClose=close;
      }
      state.priorClose=l.priorClose?.value?'captured':'missing';state.dayClose=l.dayClose?.value?'captured':closeDue?'missing':'pending';
      for(const [field,minutes] of [['at15',15],['at60',60]]){
        if(l[field]?.close){state[field]='captured';continue;}
        const due=windowState(i,minutes,now);state[field]=due;
        if(due==='due'){
          if(state.minuteRetryAt&&Date.parse(state.minuteRetryAt)>now){state[field]='plan-not-authorized';continue;}
          stage='minute';
          const rows=await bars(ticker,e.date,'minute'),measured=indexMeasurement(rows,i,minutes);
          if(measured){l[field]=measured.after;l.beforeRelease??=measured.before;state[field]='captured';}else state[field]='exact-bars-missing';
        }
      }
      state.checkedAt=new Date(now).toISOString();delete state.error;
      if(Object.values(state).includes('outside-index-session'))l.intradayStatus='outside-index-session';
      else if(l.at15||l.at60)l.intradayStatus='measured';
      else l.intradayStatus='awaiting-minute-bars';
      if(['missing','exact-bars-missing'].some(s=>Object.values(state).includes(s)))state.retryAt=new Date(now+15*60000).toISOString();
      else delete state.retryAt;
    }catch(error){state.error=error.message;state.checkedAt=new Date(now).toISOString();state.retryAt=new Date(now+15*60000).toISOString();if(error.message.includes('403')&&stage==='minute'){l.intradayStatus='plan-not-authorized';state.minuteRetryAt=new Date(now+24*3600000).toISOString();}}
  }
  const overdue=release!==null&&now>release+2*3600000;
  r.missingFields=Object.fromEntries(['previous','expected','actual','surprise'].filter(f=>r[f]==null).map(f=>[f,{status:r.outcomeError?'source-unavailable':'awaiting-verification',reason:r.outcomeError??'No verified source value'}]));
  if(overdue&&r.status!=='verified')report.issues.push({id:e.id,field:'outcome',reason:r.outcomeError??'Awaiting verified release'});
  for(const [name,state] of Object.entries(r.capture))if(state.error||Object.values(state).some(s=>['missing','exact-bars-missing','plan-not-authorized'].includes(s)))report.issues.push({id:e.id,asset:name,reason:state.error??'Due price window unavailable; see capture states'});
}
archive.lastUpdated=today;archive.updatedAt=new Date(now).toISOString();
await fs.writeFile(new URL('history/event-results.json',root),JSON.stringify(archive,null,2)+'\n');
await fs.mkdir(new URL('history/result-capture/',root),{recursive:true});await fs.writeFile(new URL('history/result-capture/latest.json',root),JSON.stringify(report,null,2)+'\n');
console.log(`Result capture: ${report.requests} market requests; ${report.issues.length} outstanding issues. See history/result-capture/latest.json.`);
if(report.issues.length)process.exitCode=1;
