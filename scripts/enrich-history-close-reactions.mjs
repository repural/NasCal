#!/usr/bin/env node
// Add a ticker's event-to-close and full-session reactions for one archived month.
// Timed events use the exact pre-release minute close already stored in history.
// After-close earnings use the next regular-session close versus release-day close.
import { readFile, writeFile } from "node:fs/promises";

const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,"").split("=",2)));
const month=args.month;
const ticker=args.ticker??"NVDA";
if(!/^\d{4}-\d{2}$/.test(month??"")||!/^[A-Z]{1,6}$/.test(ticker))throw new Error("Use --month=YYYY-MM [--ticker=NVDA]");
const apiKey=process.env.MASSIVE_API_KEY;
if(!apiKey)throw new Error("Set MASSIVE_API_KEY in NasCal Actions secrets.");
const file=new URL("../history/event-results.json",import.meta.url);
const archive=JSON.parse(await readFile(file,"utf8"));
const from=new Date(`${month}-01T00:00:00Z`);
const to=new Date(Date.UTC(from.getUTCFullYear(),from.getUTCMonth()+1,7));
const start=new Date(Date.UTC(from.getUTCFullYear(),from.getUTCMonth(),-6));
const day=d=>d.toISOString().slice(0,10);
const url=new URL(`https://api.massive.com/v2/aggs/ticker/${ticker}/range/1/day/${day(start)}/${day(to)}`);
for(const [k,v] of Object.entries({adjusted:"true",sort:"asc",limit:"5000"}))url.searchParams.set(k,v);
const response=await fetch(url,{headers:{Authorization:`Bearer ${apiKey}`}});
if(!response.ok)throw new Error(`Massive daily aggregates HTTP ${response.status}`);
const body=await response.json();
if(body.status!=="OK"||body.next_url)throw new Error("Incomplete Massive daily aggregate response");
const sessions=(body.results??[]).filter(x=>Number.isFinite(x.c)).map(x=>({date:day(new Date(x.t)),close:x.c}));
const byDate=new Map(sessions.map(x=>[x.date,x.close]));
const previous=date=>[...sessions].reverse().find(x=>x.date<date);
const next=date=>sessions.find(x=>x.date>date);
const percent=(after,before)=>Math.round((after/before-1)*10000)/100;
const signed=n=>`${n>=0?"+":""}${n.toFixed(2)}%`;
let count=0;
for(const result of archive.results){
  const event=archive.eventIndex[result.eventId];
  if(event?.eventDate.slice(0,7)!==month||result.status!=="verified")continue;
  const close=byDate.get(event.eventDate);
  if(!Number.isFinite(close))continue;
  const window=result.reactionWindows?.find(x=>x.assets?.[ticker]);
  const pre=window?.assets?.[ticker]?.at15?.before??window?.assets?.[ticker]?.at60?.before;
  let baseline,closing,baselineDate,closingDate,baselineTimeET,method;
  if(/^\d{2}:\d{2}$/.test(event.timeET??"")&&pre?.close>0){
    baseline=pre.close;closing=close;baselineDate=event.eventDate;closingDate=event.eventDate;
    baselineTimeET=pre.minuteET;
    method="Exact last completed minute before release versus that day's adjusted official daily close; includes other news and trading through 16:00 ET.";
  } else if(event.timeET==="after-close"&&event.eventKey.endsWith("-earnings")){
    const following=next(event.eventDate);
    if(!following)continue;
    baseline=close;closing=following.close;baselineDate=event.eventDate;closingDate=following.date;
    baselineTimeET="regular market close";
    method="Earnings release-day adjusted close versus the following regular-session adjusted close; intervening news may affect the move.";
  } else continue;
  const pct=percent(closing,baseline);
  const prior=previous(event.eventDate);
  result.closeReactions??={};
  result.closeReactions[ticker]={pct,baseline:{date:baselineDate,timeET:baselineTimeET,close:baseline},close:{date:closingDate,timeET:"16:00",close:closing},
    sessionPct:prior&&closingDate===event.eventDate?percent(closing,prior.close):null,
    priorSession:prior&&closingDate===event.eventDate?prior:null,
    method,priceSource:"Massive adjusted daily aggregates and archived adjusted minute baseline",
    priceSourceUrl:"https://massive.com/docs/rest/stocks/aggregates/custom-bars",verifiedAt:new Date().toISOString().slice(0,10)};
  result[`${ticker.toLowerCase()}Close`]=signed(pct);
  count++;
}
if(count){archive.lastUpdated=new Date().toISOString().slice(0,10);await writeFile(file,JSON.stringify(archive,null,2)+"\n");}
console.log(`Recorded ${count} ${ticker} close reactions for ${month} from ${sessions.length} trading sessions.`);
