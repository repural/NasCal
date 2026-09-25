#!/usr/bin/env node
// Backfill exact +15m/+60m ETF and Nasdaq Composite closes from Massive minute bars.
// Run for the three completed months before --as-of, or choose --from/--through.
// Absent bars stay null; an API error stops before writing partly updated history.
import { readFile, writeFile } from "node:fs/promises";
import { timestamp, measure } from "./market-reaction-utils.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,"").split("=",2)));
const asOf=args["as-of"]??new Date().toISOString().slice(0,10);
const d=new Date(`${asOf.slice(0,7)}-01T00:00:00Z`);
const from=args.from??new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-3,1)).toISOString().slice(0,7);
const through=args.through??new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-1,1)).toISOString().slice(0,7);
if(!/^\d{4}-\d{2}$/.test(from)||!/^\d{4}-\d{2}$/.test(through)||from>through)throw new Error("Use --from=YYYY-MM --through=YYYY-MM");
const key=process.env.MASSIVE_API_KEY;
if(!key)throw new Error("Set MASSIVE_API_KEY in NasCal Actions secrets before backfilling minute bars.");
const file=new URL("../history/event-results.json",import.meta.url);
const archive=JSON.parse(await readFile(file,"utf8"));
const entries=archive.results.filter(r=>{
  const i=archive.eventIndex[r.eventId];
  return i?.eventDate.slice(0,7)>=from && i?.eventDate.slice(0,7)<=through &&
    (r.reactionWindows?.some(w=>/^\d{2}:\d{2}$/.test(w.releaseTimeET))||/^\d{2}:\d{2}$/.test(i?.timeET??"")) && r.status==="verified";
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const cache=new Map();
let soxMinuteDenied=false;
let lastRequest=0;
async function bars(ticker,date){
  const id=`${ticker}/${date}`;
  if(ticker==="I:SOX"&&soxMinuteDenied)return null;
  if(cache.has(id))return cache.get(id);
  const url=new URL(`https://api.massive.com/v2/aggs/ticker/${ticker}/range/1/minute/${date}/${date}`);
  for(const [k,v] of Object.entries({adjusted:"true",sort:"asc",limit:"5000"}))url.searchParams.set(k,v);
  let body;
  for(let attempt=0;attempt<4;attempt++){
    const wait=14000-(Date.now()-lastRequest);if(wait>0)await sleep(wait);
    lastRequest=Date.now();
    const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`}});
    if(response.status===429 && attempt<3){
      await sleep(Math.max(15000,Math.min(90000,Number(response.headers.get("retry-after")||0)*1000)));
      continue;
    }
    if(response.status===403 && ticker==="I:SOX"){
      soxMinuteDenied=true;
      console.log(`${id}: SOX minute aggregates not authorized on this plan`);
      cache.set(id,null);return null;
    }
    if(!response.ok)throw new Error(`${id}: Massive HTTP ${response.status}`);
    body=await response.json();break;
  }
  if(!["OK","DELAYED"].includes(body?.status)||body.next_url)throw new Error(`${id}: incomplete Massive aggregate response (status ${body?.status}, paginated ${Boolean(body?.next_url)})`);
  const exact=new Map((body.results??[]).filter(b=>Number.isFinite(b.c)).map(b=>[b.t,b.c]));
  cache.set(id,exact);
  console.log(`${id}: ${exact.size} minute bars`);
  return exact;
}
const priceSourceUrl="https://massive.com/docs/rest/stocks/aggregates/custom-bars";
const method="Exact last completed one-minute bar before scheduled release versus the bars ending at +15m and +60m. Includes extended hours only when available. Null means the exact bar was absent; these are observed moves, not causal estimates.";
for(const record of entries){
  const indexed=archive.eventIndex[record.eventId];
  const previous=record.reactionWindows?.length?record.reactionWindows:[{label:indexed.eventKey,releaseTimeET:indexed.timeET,assets:{}}];
  const windows=[];
  for(const existing of previous){
    if(!/^\d{2}:\d{2}$/.test(existing.releaseTimeET??""))continue;
    const utc=timestamp(indexed.eventDate,existing.releaseTimeET);
    const assets={...existing.assets};
    for(const ticker of ["QQQ","NVDA","SMH","I:COMP","I:SOX"]){
      if(assets[ticker])continue;
      const series=await bars(ticker,indexed.eventDate);
      assets[ticker]={at15:series?measure(series,utc,15):null,at60:series?measure(series,utc,60):null};
    }
    windows.push({...existing,label:existing.label??indexed.eventKey,releaseTimeET:existing.releaseTimeET,
      scheduleSource:existing.scheduleSource??record.sourceUrl,caveat:existing.caveat??(indexed.confounders.join(" ")||null),
      priceSource:existing.priceSource??"Massive adjusted one-minute aggregate bars",priceSourceUrl:existing.priceSourceUrl??priceSourceUrl,
      method:existing.method??method,verifiedAt:asOf,assets});
  }
  if(!windows.length)continue;
  record.reactionWindows=windows;
  record.indexWindows=windows.map(w=>({label:w.label,releaseTimeET:w.releaseTimeET,
    nasdaq:{at15:w.assets["I:COMP"].at15?.after??null,at60:w.assets["I:COMP"].at60?.after??null},
    sox:{at15:w.assets["I:SOX"].at15?.after??null,at60:w.assets["I:SOX"].at60?.after??null}}));
  record.indexLevels??={};
  for(const [name,ticker] of [["nasdaq","I:COMP"],["sox","I:SOX"]]){
    const selected=windows.find(w=>w.assets[ticker].at15||w.assets[ticker].at60)??windows[0];
    const values=selected.assets[ticker];
    record.indexLevels[name]??={};
    record.indexLevels[name].at15=values.at15?.after??null;
    record.indexLevels[name].at60=values.at60?.after??null;
    record.indexLevels[name].beforeRelease=values.at15?.before??values.at60?.before??null;
    record.indexLevels[name].releaseLabel=selected.label;
    record.indexLevels[name].releaseTimeET=selected.releaseTimeET;
    record.indexLevels[name].intradayStatus=ticker==="I:SOX"&&soxMinuteDenied?"plan-not-authorized":values.at15||values.at60?"measured":"exact-bars-unavailable";
  }
  const qqq=windows[0].assets.QQQ;
  record.qqq15m=qqq.at15?`${qqq.at15.pct>=0?"+":""}${qqq.at15.pct.toFixed(2)}%`:null;
  record.qqq1h=qqq.at60?`${qqq.at60.pct>=0?"+":""}${qqq.at60.pct.toFixed(2)}%`:null;
  record.reactionStatus=windows.some(w=>w.assets.QQQ.at15||w.assets.QQQ.at60)?"measured":"exact-bars-unavailable";
}
if(entries.length){
  archive.lastUpdated=asOf;
  await writeFile(file,JSON.stringify(archive,null,2)+"\n");
}
console.log(`Enriched ${entries.length} releases; ${[...cache.keys()].length} ticker/date aggregate requests.`);
