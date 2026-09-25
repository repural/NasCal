#!/usr/bin/env node
// Discover high-priority candidates from official release calendars for the
// completed calendar months preceding --as-of. Discovery does not invent
// historical outcomes: a researcher verifies each release before adding it.
import { readFile, writeFile } from "node:fs/promises";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, value] = arg.replace(/^--/, "").split("=", 2);
  return [key, value ?? true];
}));
const asOf = args["as-of"] ?? new Date().toISOString().slice(0,10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error("--as-of must be YYYY-MM-DD");
const lookbackMonths = Number(args.months ?? 3);
if (!Number.isInteger(lookbackMonths) || lookbackMonths < 1 || lookbackMonths > 12) throw new Error("--months must be an integer from 1 to 12");
const base = new Date(`${asOf.slice(0,7)}-01T00:00:00Z`);
const months = Array.from({length: lookbackMonths}, (_, i) => lookbackMonths - i).map(n => {
  const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - n, 1));
  return { year: date.getUTCFullYear(), month: String(date.getUTCMonth()+1).padStart(2,"0"), name: date.toLocaleString("en-US",{month:"long",timeZone:"UTC"}) };
});
const monthNames = Object.fromEntries(months.map(m=>[m.name,m]));
const archive = JSON.parse(await readFile(new URL("../history/event-results.json",import.meta.url),"utf8"));
const candidates = new Map();
const errors = [];
const fallbacks = [];
const clean = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ")
  .replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
async function source(url) {
  const response = await fetch(url,{headers:{"user-agent":"NasCal archival calendar discovery (public release schedules)"},signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return clean(await response.text());
}
function add(date, family, label, timeET, sourceUrl) {
  if (!months.some(m => date.startsWith(`${m.year}-${m.month}`))) return;
  const key = `${date}/${family}`;
  if (candidates.has(key)) return;
  const match = Object.entries(archive.eventIndex).find(([,event]) =>
    event.eventDate === date && event.eventKey === family)?.[0] ?? null;
  candidates.set(key,{date,family,label,timeET,sourceUrl,historyEventId:match,status:match?"recorded":"needs-release-verification"});
}
const dateKey = (m,d)=>`${monthNames[m].year}-${monthNames[m].month}-${String(d).padStart(2,"0")}`;
const fetches = [];
for (const m of months) {
  const url = `https://www.bls.gov/schedule/${m.year}/${m.month}_sched_list.htm`;
  fetches.push(source(url).then(text=>{
    const re = /(?:Monday|Tuesday|Wednesday|Thursday|Friday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+\d{4}\s+(\d{2}):(\d{2})\s+(AM|PM)\s+([^]*?)(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}|NOTE: All times)/g;
    for (const [,month,day,hour,minute,amPm,release] of text.matchAll(re)) {
      if (!monthNames[month]) continue;
      const families=[
        [/Employment Situation for/,"employment-report","Employment report"],
        [/Consumer Price Index for/,"cpi","CPI"],
        [/Producer Price Index for/,"ppi","PPI"],
        [/Job Openings and Labor Turnover Survey for/,"jolts","JOLTS"],
        [/Employment Cost Index for/,"employment-cost","Employment Cost Index"],
      ];
      const hit=families.find(([re])=>re.test(release));
      if(hit) add(dateKey(month,day),hit[1],hit[2],`${String(Number(hour)%12+(amPm==="PM"?12:0)).padStart(2,"0")}:${minute}`,url);
    }
  }).catch(e=>errors.push(String(e))));
}
const beaUrl="https://www.bea.gov/news/schedule/full";
fetches.push(source(beaUrl).then(text=>{
  const re=/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(\d{1,2}):(\d{2})\s+(AM|PM)\s+N\s*ews\s+([\s\S]*?)(?=(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s+\d{1,2}:\d{2}\s+(?:AM|PM)|To Be Announced)/g;
  for(const [,month,day,hour,minute,amPm,label] of text.matchAll(re)){
    if(!monthNames[month])continue;
    const family=/Personal Income and Outlays/.test(label)?"core-pce":/GDP \(Advance Estimate\)/.test(label)?"gdp-advance":/GDP \(Second Estimate\)/.test(label)?"gdp-second":null;
    if(family)add(dateKey(month,day),family,label.trim(),`${String(Number(hour)%12+(amPm==="PM"?12:0)).padStart(2,"0")}:${minute}`,beaUrl);
  }
}).catch(e=>errors.push(String(e))));
const retailUrl="https://www.census.gov/retail/release_schedule.html";
fetches.push(source(retailUrl).then(text=>{
  const section=text.split("Advance Monthly Retail Trade Report")[1]?.split("Monthly Retail Trade Report")[0]??"";
  const re=/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+\d{4}/g;
  for(const [,month,day] of section.matchAll(re))if(monthNames[month])add(dateKey(month,day),"retail-sales","Advance retail sales","08:30",retailUrl);
}).catch(e=>errors.push(String(e))));
const ismUrl="https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/";
fetches.push(source(ismUrl).then(text=>{
  let found=0;
  for(const [,month,year,mfg,services] of text.matchAll(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\s+(\d{1,2})\s+(\d{1,2})/g)){
    if(!monthNames[month])continue;
    if(Number(year)!==monthNames[month].year)continue;
    add(dateKey(month,mfg),"ism-manufacturing","ISM Manufacturing PMI","10:00",ismUrl);
    add(dateKey(month,services),"ism-services","ISM Services PMI","10:00",ismUrl);
    found++;
  }
  if(!found)throw new Error("ISM response contained no release dates (possibly a login redirect)");
}).catch(async e=>{
  try {
    const fallback=JSON.parse(await readFile(new URL("../history/official-schedule-snapshot-2026.json",import.meta.url),"utf8"));
    const applicable=fallback.releases.filter(r=>months.some(m=>r.date.startsWith(`${m.year}-${m.month}`)));
    if(!applicable.length){errors.push(String(e));return;}
    for(const r of applicable)add(r.date,r.family,r.label,r.timeET,fallback.sourceUrl);
    fallbacks.push(`ISM live schedule unavailable (${e}); used source-verified 2026 schedule snapshot dated ${fallback.verifiedAt}.`);
  } catch(fallbackError){errors.push(`${e}; ISM snapshot: ${fallbackError}`);}
}));
const fedUrl="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
fetches.push(source(fedUrl).then(text=>{
  for(const month of months.map(m=>m.name)){
    const year=monthNames[month].year;
    const section=text.split(`${year} FOMC Meetings`)[1]?.split(`${year-1} FOMC Meetings`)[0]??"";
    const range=section.match(new RegExp(`(?:^|\\s)${month}\\s+(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})\\*?\\s+Statement`));
    if(range)add(dateKey(month,range[2]),"fomc-decision","FOMC decision","14:00",fedUrl);
  }
}).catch(e=>errors.push(String(e))));
await Promise.all(fetches);
const report={asOf,range:[`${months[0].year}-${months[0].month}`,`${months[2].year}-${months[2].month}`],
  checkedOn:asOf,sources:[beaUrl,retailUrl,ismUrl,fedUrl,...months.map(m=>`https://www.bls.gov/schedule/${m.year}/${m.month}_sched_list.htm`)],
  candidates:[...candidates.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.family.localeCompare(b.family)),fallbacks,errors};
if (!report.candidates.length || errors.length === report.sources.length) throw new Error(`Discovery failed: ${errors.join("; ")}`);
const output=args.output??"history/discovery.json";
await writeFile(output,JSON.stringify(report,null,2)+"\n");
console.log(`Discovered ${report.candidates.length} candidates; ${report.candidates.filter(x=>!x.historyEventId).length} need release verification; ${errors.length} source errors.`);
