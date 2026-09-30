#!/usr/bin/env node
// One daily aggregate request per instrument enriches every earnings event in the archive.
// The complete price history stays under history/, separate from the public site build.
import {readFile,writeFile} from "node:fs/promises";
import {seedMicron2025,micron2025} from "./seed-micron-earnings-2025.mjs";

const file=new URL("../history/event-results.json",import.meta.url);
const archive=JSON.parse(await readFile(file,"utf8"));
seedMicron2025(archive);
const megacapManifest=archive.earnings?.releaseManifest;
if(!megacapManifest?.events?.length)throw new Error("Missing consolidated megacap earnings manifest");
const key=process.env.MASSIVE_API_KEY;
if(!key)throw new Error("MASSIVE_API_KEY is required");
const today=new Date().toISOString().slice(0,10);
const et=Object.fromEntries(new Intl.DateTimeFormat("en-US",{
  timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",hourCycle:"h23"
}).formatToParts(new Date()).map(part=>[part.type,part.value]));
const etDate=`${et.year}-${et.month}-${et.day}`;
// Do not mistake the current, still-changing daily bar for an official close.
const marketThrough=Number(et.hour)>=17?etDate:
  new Date(Date.parse(`${etDate}T00:00:00Z`)-86400000).toISOString().slice(0,10);
const universe={
  semiconductor:["NVDA","AMD","AVGO","TSM","MU"],
  megacap:["AAPL","MSFT","AMZN","GOOGL","META","TSLA"],
  etf:["QQQ","SMH","SOXX"],
  index:["I:COMP","I:SOX"]
};
const symbols=Object.values(universe).flat();
// Preserve the announced upcoming Micron report so its dated lead-up is captured now.
const micronId="2026-09-30-MU";
if(!archive.eventIndex[micronId]){
  archive.eventIndex[micronId]={eventDate:"2026-09-30",eventKey:"micron-fiscal-q4-earnings",
    eventType:"Earnings",importance:"Critical",timeET:"after-close",
    surpriseDirection:"pending",nasdaqReactionDirection:"pending",
    dominantDriver:"micron-earnings",confounders:["PCE and GDP on T0","ISM Manufacturing on T+1"]};
  archive.results.push({eventId:micronId,status:"pending",previous:null,expected:null,
    actual:null,surprise:null,explanation:null,
    sourceUrl:"https://micron.gcs-web.com/news-releases/news-release-details/micron-technology-report-fiscal-fourth-quarter-results-5"});
}
// Keep the two recent Micron reports as distinct historical events. Their
// cross-asset sessions use the same 16-symbol capture as newer earnings.
for(const event of [
  {id:"2026-03-18-MU",date:"2026-03-18",key:"micron-fiscal-q2-earnings",
    actual:"Micron reported fiscal second-quarter 2026 results after the market close.",
    sourceUrl:"https://investors.micron.com/news/press-release/2026/Micron-Technology-Inc--Reports-Results-for-the-Second-Quarter-of-Fiscal-2026-03-18-2026/default.aspx"},
  {id:"2026-06-24-MU",date:"2026-06-24",key:"micron-fiscal-q3-earnings",
    actual:"Micron reported fiscal third-quarter 2026 results after the market close.",
    sourceUrl:"https://investors.micron.com/news/press-release/2026/Micron-Technology-Inc--Reports-Record-Results-for-the-Third-Quarter-of-Fiscal-2026/default.aspx"}
]){
  if(!archive.eventIndex[event.id]){
    archive.eventIndex[event.id]={eventDate:event.date,eventKey:event.key,
      eventType:"Earnings",importance:"Critical",timeET:"after-close",
      surpriseDirection:"unassessed",nasdaqReactionDirection:"unverified",
      dominantDriver:"micron-earnings",confounders:["Other same-day macro and sector developments"]};
  }
  if(!archive.results.some(record=>record.eventId===event.id)){
    archive.results.push({eventId:event.id,status:"verified",previous:null,
      expected:"No reliable archived pre-release consensus is stored.",
      actual:event.actual,surprise:"Not assessed against archived consensus.",
      explanation:"The T0 close precedes the after-close report. T+1 is the first cash-session reaction; daily market moves are not solely attributable to earnings.",
      sourceUrl:event.sourceUrl,verifiedAt:today});
  }
}
// A dated, source-backed manifest keeps each megacap release separate, including
// simultaneous reports. Each record receives the same full cross-asset window.
for(const event of megacapManifest.events){
  const eventId=`${event.date}-${event.symbol}`;
  const sameDay=megacapManifest.events
    .filter(other=>other.date===event.date&&other.symbol!==event.symbol)
    .map(other=>`${other.symbol} earnings on the same date`);
  if(!archive.eventIndex[eventId]){
    archive.eventIndex[eventId]={
      eventDate:event.date,eventKey:`${event.symbol.toLowerCase()}-earnings`,
      eventType:"Earnings",importance:"High",timeET:event.releaseSession,
      surpriseDirection:"unassessed",nasdaqReactionDirection:"unverified",
      dominantDriver:`${event.symbol.toLowerCase()}-earnings`,confounders:sameDay
    };
  }
  if(!archive.results.some(record=>record.eventId===eventId)){
    archive.results.push({
      eventId,status:"verified",previous:null,
      expected:"No reliable archived pre-release consensus is stored.",
      actual:`${event.symbol} reported ${event.period} results after the close.`,
      surprise:"Not assessed against archived consensus.",
      explanation:"T0 is the close before the after-hours report; T+1 is the first regular-session close. Other simultaneous events can affect the observed returns.",
      sourceUrl:event.sourceUrl,verifiedAt:megacapManifest.verifiedAt
    });
  }
}
const events=archive.results
  .map(record=>({record,meta:archive.eventIndex[record.eventId]}))
  .filter(({meta})=>meta?.eventType==="Earnings"&&meta.eventDate<=new Date(Date.now()+20*86400000).toISOString().slice(0,10));
if(!events.length)process.exit(0);
const earliest=events.map(x=>x.meta.eventDate).sort()[0];
const from=new Date(Date.parse(`${earliest}T00:00:00Z`)-25*86400000).toISOString().slice(0,10);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const market={};
for(const [i,symbol] of symbols.entries()){
  // Use the same daily adjusted aggregates as the existing index and ETF history.
  if(i)await wait(13000);
  const url=new URL(`https://api.massive.com/v2/aggs/ticker/${symbol}/range/1/day/${from}/${marketThrough}`);
  for(const [k,v] of Object.entries({adjusted:"true",sort:"asc",limit:"5000"}))url.searchParams.set(k,v);
  let response;
  for(let retry=0;retry<4;retry++){
    response=await fetch(url,{headers:{Authorization:`Bearer ${key}`}});
    if(response.status!==429)break;
    await wait(15000*(retry+1));
  }
  if(!response?.ok)throw new Error(`${symbol}: Massive daily aggregates HTTP ${response?.status}`);
  const body=await response.json();
  if(!["OK","DELAYED"].includes(body.status)||body.next_url)throw new Error(`${symbol}: incomplete daily aggregates`);
  const rows=(body.results??[]).filter(x=>Number.isFinite(x.c))
    .map(x=>({date:new Date(x.t).toISOString().slice(0,10),close:x.c}));
  market[symbol]=new Map(rows.map((row,n)=>[row.date,{
    close:row.close,
    previousClose:n?rows[n-1].close:null,
    closeToClosePct:n?Math.round((row.close/rows[n-1].close-1)*10000)/100:null
  }]));
  console.log(`${symbol}: ${rows.length} daily closes`);
}
// Index providers can publish a weekend-dated aggregate. Anchor offsets to
// ordinary U.S. equity sessions confirmed by an ETF close instead.
const dates=[...market["I:COMP"].keys()].filter(date=>{
  const day=new Date(`${date}T12:00:00Z`).getUTCDay();
  return day>=1&&day<=5&&market.QQQ.has(date);
}).sort();
const pct=(after,before)=>after!=null&&before>0?Math.round((after/before-1)*10000)/100:null;
const sourceUrl="https://massive.com/docs/rest/stocks/aggregates/custom-bars";
let updated=0;
for(const {record,meta} of events){
  const position=dates.indexOf(meta.eventDate);
  // Future dates have no T0 close yet. Retain dated observations without inventing offsets.
  const range=position<0?dates.filter(date=>date<meta.eventDate).slice(-7)
    :dates.slice(Math.max(0,position-7),position+8);
  const firstReactionOffset=meta.timeET==="before-open"?0:1;
  const day0=Object.fromEntries(symbols.map(symbol=>[symbol,market[symbol].get(meta.eventDate)?.close??null]));
  const firstDate=position<0?null:dates[position+firstReactionOffset];
  const firstClose=Object.fromEntries(symbols.map(symbol=>[symbol,firstDate?market[symbol].get(firstDate)?.close??null:null]));
  const sessions=range.map(date=>{
    const offset=position<0?null:dates.indexOf(date)-position;
    const assets=Object.fromEntries(symbols.map(symbol=>{
      const row=market[symbol].get(date)??null;
      if(!row)return [symbol,null];
      return [symbol,{...row,
        relativeToT0Pct:offset!=null?pct(row.close,day0[symbol]):null,
        cumulativeFromT0Pct:offset!=null&&offset>=1?pct(row.close,day0[symbol]):null,
        sinceFirstReactionPct:offset!=null&&offset>=firstReactionOffset&&firstDate?pct(row.close,firstClose[symbol]):null
      }];
    }));
    return {date,offset,assets};
  });
  const complete=position>=0&&dates[position+7]&&dates[position+7]<=today
    &&sessions.length===15&&sessions.every(s=>symbols.every(symbol=>s.assets[symbol]?.previousClose>0));
  const window={
    schemaVersion:1,source:"Massive adjusted daily aggregates",sourceUrl,
    universe,releaseSession:meta.timeET,
    windowStatus:position<0?"pre-event-partial":complete?"complete":"post-event-partial",
    method:"For every asset, adjusted close and prior trading-session close; close-to-close %, every T-7 to T+7 session relative to T0 %, T0-to-T+n cumulative %, and reaction-close-to-T+n %. T0 is the earnings date. Future pre-event observations have dates but no T offsets until T0 exists.",
    sessions
  };
  const {updatedAt:previousUpdate,...previousWindow}=record.earningsCrossAssets??{};
  if(JSON.stringify(previousWindow)!==JSON.stringify(window)){
    record.earningsCrossAssets={...window,updatedAt:today};updated++;
  }
  if(micron2025.some(event=>`${event.date}-MU`===record.eventId)&&position>=0){
    for(const [name,symbol] of [["nasdaq","I:COMP"],["sox","I:SOX"]]){
      const before=dates[position-1],prior=market[symbol].get(before),close=market[symbol].get(meta.eventDate);
      record.indexLevels??={};
      record.indexLevels[name]={priorClose:prior?{date:before,value:prior.close}:null,
        dayClose:close?{date:meta.eventDate,value:close.close}:null,at15:null,at60:null,
        intradayStatus:"not-applicable-after-close",
        intradayReason:"Cash Nasdaq Composite and SOX do not publish regular-session levels 15/60 minutes after an after-close earnings release. T+1 captures the first cash-session reaction.",
        sourceUrl:"https://massive.com/docs/rest/indices/aggregates/custom-bars",updatedAt:today};
    }
    if(complete){
      const at=offset=>sessions.find(session=>session.offset===offset).assets;
      const lead=at(-7),zero=at(0),first=at(1),last=at(7);
      const summary={date:meta.eventDate,session:"after_close",
        leadStock:pct(zero.MU.close,lead.MU.close),leadBenchmark:pct(zero["I:SOX"].close,lead["I:SOX"].close),
        firstStock:pct(first.MU.close,zero.MU.close),firstBenchmark:pct(first["I:SOX"].close,zero["I:SOX"].close),
        followStock:pct(last.MU.close,first.MU.close),followBenchmark:pct(last["I:SOX"].close,first["I:SOX"].close),
        totalStock:pct(last.MU.close,zero.MU.close),totalBenchmark:pct(last["I:SOX"].close,zero["I:SOX"].close)};
      const rows=archive.earnings.summaries.MU??=[];
      const existing=rows.findIndex(row=>row.date===meta.eventDate);
      if(existing<0)rows.push(summary);else rows[existing]=summary;
      rows.sort((a,b)=>a.date.localeCompare(b.date));
      const release=micron2025.find(event=>event.date===meta.eventDate);
      if(!megacapManifest.events.some(event=>event.symbol==="MU"&&event.date===meta.eventDate))
        megacapManifest.events.push({symbol:"MU",date:meta.eventDate,period:release.period,releaseSession:"after-close",sourceUrl:release.sourceUrl});
      archive.earnings.asOf=today;
    }
  }
}
if(updated){
  archive.lastUpdated=today;
  await writeFile(file,JSON.stringify(archive,null,2)+"\n");
}
console.log(`Updated ${updated} earnings windows across ${symbols.length} assets.`);
