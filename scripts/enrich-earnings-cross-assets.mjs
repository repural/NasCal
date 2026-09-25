#!/usr/bin/env node
// One daily aggregate request per instrument enriches every earnings event in the archive.
// The complete price history stays under history/, separate from the public site build.
import {readFile,writeFile} from "node:fs/promises";

const file=new URL("../history/event-results.json",import.meta.url);
const archive=JSON.parse(await readFile(file,"utf8"));
const key=process.env.MASSIVE_API_KEY;
if(!key)throw new Error("MASSIVE_API_KEY is required");
const today=new Date().toISOString().slice(0,10);
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
  const url=new URL(`https://api.massive.com/v2/aggs/ticker/${symbol}/range/1/day/${from}/${today}`);
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
const dates=[...market["I:COMP"].keys()].sort();
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
    method:"For every asset, adjusted close and prior trading-session close; close-to-close %, T0-to-T+n cumulative %, and reaction-close-to-T+n %. T0 is the earnings date. Future pre-event observations have dates but no T offsets until T0 exists.",
    sessions
  };
  const {updatedAt:previousUpdate,...previousWindow}=record.earningsCrossAssets??{};
  if(JSON.stringify(previousWindow)!==JSON.stringify(window)){
    record.earningsCrossAssets={...window,updatedAt:today};updated++;
  }
}
if(updated){
  archive.lastUpdated=today;
  await writeFile(file,JSON.stringify(archive,null,2)+"\n");
}
console.log(`Updated ${updated} earnings windows across ${symbols.length} assets.`);
