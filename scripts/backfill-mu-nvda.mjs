#!/usr/bin/env node
// Preserve adjusted NVDA closes on the same sessions as the two Micron earnings windows.
import { writeFile } from "node:fs/promises";
const key=process.env.MASSIVE_API_KEY;
if(!key)throw new Error("MASSIVE_API_KEY is required");
const dates={
  "2026-06-24": [
    "2026-06-12",
    "2026-06-15",
    "2026-06-16",
    "2026-06-17",
    "2026-06-18",
    "2026-06-22",
    "2026-06-23",
    "2026-06-24",
    "2026-06-25",
    "2026-06-26",
    "2026-06-29",
    "2026-06-30",
    "2026-07-01",
    "2026-07-02",
    "2026-07-06"
  ],
  "2026-03-18": [
    "2026-03-09",
    "2026-03-10",
    "2026-03-11",
    "2026-03-12",
    "2026-03-13",
    "2026-03-16",
    "2026-03-17",
    "2026-03-18",
    "2026-03-19",
    "2026-03-20",
    "2026-03-23",
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27"
  ]
};
const url=new URL("https://api.massive.com/v2/aggs/ticker/NVDA/range/1/day/2026-03-05/2026-07-07");
url.searchParams.set("adjusted","true");
url.searchParams.set("sort","asc");
url.searchParams.set("limit","5000");
const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`}});
if(!response.ok)throw new Error(`Massive NVDA daily aggregate HTTP ${response.status}`);
const body=await response.json();
if(!["OK","DELAYED"].includes(body.status)||body.next_url)throw new Error("Incomplete NVDA daily aggregates");
const rows=(body.results??[]).filter(x=>Number.isFinite(x.c)).map(x=>({date:new Date(x.t).toISOString().slice(0,10),close:x.c}));
const map=new Map(rows.map((row,i)=>[row.date,{close:row.close,previousClose:i?rows[i-1].close:null}]));
const pct=(a,b)=>b>0?Math.round((a/b-1)*10000)/100:null;
const events=Object.fromEntries(Object.entries(dates).map(([earningsDate,sessions])=>{
  const t0=map.get(earningsDate)?.close;
  if(!t0)throw new Error(`Missing T0: ${earningsDate}`);
  return [earningsDate,sessions.map((date,i)=>{
    const row=map.get(date);
    if(!row?.previousClose)throw new Error(`Missing NVDA session: ${date}`);
    return {offset:i-7,date,close:row.close,previousClose:row.previousClose,
      changePct:pct(row.close,row.previousClose),fromT0Pct:pct(row.close,t0)};
  })];
}));
await writeFile(new URL("../history/mu-nvda-earnings-2026.json",import.meta.url),
  JSON.stringify({schemaVersion:1,source:"Massive adjusted daily aggregates",
    sourceUrl:"https://massive.com/docs/rest/stocks/aggregates/custom-bars",
    capturedAt:new Date().toISOString(),events},null,2)+"\n");
console.log("Stored two complete 15-session NVDA windows.");
