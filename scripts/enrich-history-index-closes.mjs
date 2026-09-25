#!/usr/bin/env node
// Save observed Nasdaq Composite and SOX index levels for each verified event.
import {readFile,writeFile} from "node:fs/promises";

const key=process.env.MASSIVE_API_KEY;
if(!key)throw new Error("MASSIVE_API_KEY is required");
const file=new URL("../history/event-results.json",import.meta.url);
const archive=JSON.parse(await readFile(file,"utf8"));
const today=new Date().toISOString().slice(0,10);
const dates=archive.results.filter(r=>r.status==="verified").map(r=>archive.eventIndex[r.eventId]?.eventDate).filter(d=>d&&d<=today).sort();
if(!dates.length)process.exit(0);
const begin=new Date(`${dates[0]}T00:00:00Z`);
begin.setUTCDate(begin.getUTCDate()-10);
const start=begin.toISOString().slice(0,10);
const sessions={};
for(const [name,ticker] of [["nasdaq","I:COMP"],["sox","I:SOX"]]){
  const url=new URL(`https://api.massive.com/v2/aggs/ticker/${ticker}/range/1/day/${start}/${today}`);
  for(const [k,v] of Object.entries({adjusted:"true",sort:"asc",limit:"5000"}))url.searchParams.set(k,v);
  let response;
  for(let retry=0;retry<4;retry++){
    response=await fetch(url,{headers:{Authorization:`Bearer ${key}`}});
    if(response.status!==429)break;
    await new Promise(resolve=>setTimeout(resolve,15000*(retry+1)));
  }
  if(!response.ok)throw new Error(`${ticker}: daily aggregates HTTP ${response.status}`);
  const body=await response.json();
  if(body.status!=="OK"||body.next_url)throw new Error(`${ticker}: incomplete daily aggregates`);
  sessions[name]=(body.results??[]).filter(b=>Number.isFinite(b.c)).map(b=>({date:new Date(b.t).toISOString().slice(0,10),value:b.c}));
}
let changed=0;
for(const result of archive.results){
  const event=archive.eventIndex[result.eventId];
  if(result.status!=="verified"||!event||event.eventDate>today)continue;
  result.indexLevels??={};
  for(const name of ["nasdaq","sox"]){
    const rows=sessions[name];
    const prior=[...rows].reverse().find(x=>x.date<event.eventDate)??null;
    const close=rows.find(x=>x.date===event.eventDate)??null;
    const levels=result.indexLevels[name]??{};
    if(JSON.stringify([levels.priorClose,levels.dayClose])!==JSON.stringify([prior,close]))changed++;
    result.indexLevels[name]={...levels,priorClose:prior,at15:levels.at15??null,at60:levels.at60??null,dayClose:close,
      intradayStatus:levels.intradayStatus??"awaiting-minute-bars",sourceUrl:"https://massive.com/docs/rest/indices/aggregates/custom-bars",updatedAt:today};
  }
}
if(changed){archive.lastUpdated=today;await writeFile(file,JSON.stringify(archive,null,2)+"\n");}
console.log(`Updated ${changed} index close values.`);
