#!/usr/bin/env node
// Backfill exact +15m/+60m QQQ, NVDA and SMH closes from Massive minute bars.
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
    /^\d{2}:\d{2}$/.test(i?.timeET??"") && r.status==="verified";
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const cache=new Map();
let lastRequest=0;
async function bars(ticker,date){
  const id=`${ticker}/${date}`;
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
    if(!response.ok)throw new Error(`${id}: Massive HTTP ${response.status}`);
    body=await response.json();break;
  }
  if(body?.status!=="OK"||body.next_url)throw new Error(`${id}: incomplete Massive aggregate response`);
  const exact=new Map((body.results??[]).filter(b=>Number.isFinite(b.c)).map(b=>[b.t,b.c]));
  cache.set(id,exact);
  console.log(`${id}: ${exact.size} minute bars`);
  return exact;
}
const priceSourceUrl="https://massive.com/docs/rest/stocks/aggregates/custom-bars";
const method="Exact last completed one-minute bar before scheduled release versus the bars ending at +15m and +60m. Includes extended hours only when available. Null means the exact bar was absent; these are observed moves, not causal estimates.";
for(const record of entries){
  const indexed=archive.eventIndex[record.eventId];
  const utc=timestamp(indexed.eventDate,indexed.timeET);
  const assets={};
  for(const ticker of ["QQQ","NVDA","SMH"]){
    const series=await bars(ticker,indexed.eventDate);
    assets[ticker]={at15:measure(series,utc,15),at60:measure(series,utc,60)};
  }
  const window={label:indexed.eventKey,releaseTimeET:indexed.timeET,scheduleSource:record.sourceUrl,
    caveat:indexed.confounders.join(" ")||null,priceSource:"Massive adjusted one-minute aggregate bars",
    priceSourceUrl,method,verifiedAt:asOf,assets};
  record.reactionWindows=[window];
  record.qqq15m=assets.QQQ.at15?`${assets.QQQ.at15.pct>=0?"+":""}${assets.QQQ.at15.pct.toFixed(2)}%`:null;
  record.qqq1h=assets.QQQ.at60?`${assets.QQQ.at60.pct>=0?"+":""}${assets.QQQ.at60.pct.toFixed(2)}%`:null;
  record.reactionStatus=assets.QQQ.at15||assets.QQQ.at60?"measured":"exact-bars-unavailable";
}
if(entries.length){
  archive.lastUpdated=asOf;
  await writeFile(file,JSON.stringify(archive,null,2)+"\n");
}
console.log(`Enriched ${entries.length} releases; ${[...cache.keys()].length} ticker/date aggregate requests.`);
