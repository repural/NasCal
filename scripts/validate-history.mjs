#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
const root=new URL("../history/event-results.json",import.meta.url);
const history=JSON.parse(await readFile(root,"utf8"));
const earnings=history.earnings;
if(!earnings?.asOf||!earnings?.releaseManifest?.verifiedAt||!earnings?.summaries||!earnings?.benchmark)
  throw new Error("Missing consolidated earnings history");
const earningsSummaryIds=new Set();
for(const [symbol,rows] of Object.entries(earnings.summaries)){
  if(!earnings.benchmark[symbol])throw new Error(`Missing earnings benchmark: ${symbol}`);
  for(const row of rows){
    const id=`${row.date}-${symbol}`;
    if(earningsSummaryIds.has(id))throw new Error(`Duplicate earnings summary: ${id}`);
    earningsSummaryIds.add(id);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||
      !["after_close","before_open"].includes(row.session)||
      !["leadStock","leadBenchmark","firstStock","firstBenchmark","followStock","followBenchmark","totalStock","totalBenchmark"].every(field=>Number.isFinite(row[field])))
      throw new Error(`Invalid earnings summary: ${id}`);
  }
}
const manifestIds=new Set();
for(const event of earnings.releaseManifest.events){
  const id=`${event.date}-${event.symbol}`;
  if(manifestIds.has(id))throw new Error(`Duplicate earnings release: ${id}`);
  manifestIds.add(id);
  if(!earningsSummaryIds.has(id)||!/^https:\/\//.test(event.sourceUrl??""))
    throw new Error(`Missing summary/source for earnings release: ${id}`);
}
const seen=new Set();
for(const record of history.results){
  if(seen.has(record.eventId))throw new Error(`Duplicate historical result: ${record.eventId}`);
  seen.add(record.eventId);
  const index=history.eventIndex[record.eventId];
  if(!index||!/^\d{4}-\d{2}-\d{2}$/.test(index.eventDate))throw new Error(`Missing indexed date: ${record.eventId}`);
  if(record.status==="verified"&&(!record.actual||!/^https:\/\//.test(record.sourceUrl||"")))throw new Error(`Unverified actual/source: ${record.eventId}`);
  if(record.reactionWindows){
    for(const window of record.reactionWindows){
      if(!window.releaseTimeET||!/^https:\/\//.test(window.scheduleSource??record.sourceUrl??""))throw new Error(`Missing release-window provenance: ${record.eventId}`);
      const measured=Object.values(window.assets??{}).some(asset=>asset?.at15||asset?.at60);
      if(measured&&!/^https:\/\//.test(window.priceSourceUrl??""))throw new Error(`Missing measured-market provenance: ${record.eventId}`);
      for(const ticker of ["QQQ","NVDA","SMH"])for(const point of ["at15","at60"]){
        const value=window.assets?.[ticker]?.[point];
        if(value!==null && value!==undefined && (!Number.isFinite(value.pct)||!Number.isFinite(value.before?.close)||!Number.isFinite(value.after?.close)))
          throw new Error(`Invalid ${ticker} ${point}: ${record.eventId}`);
      }
    }
  }
  for(const [ticker,close] of Object.entries(record.closeReactions??{})){
    if(!Number.isFinite(close.pct)||!(close.baseline?.close>0)||!(close.close?.close>0)||
       !/^https:\/\//.test(close.priceSourceUrl??"")||
       Math.abs(close.pct-Math.round((close.close.close/close.baseline.close-1)*10000)/100)>0.001)
      throw new Error(`Invalid ${ticker} close reaction: ${record.eventId}`);
  }
  const window=record.earningsCrossAssets;
  if(window){
    if(index.eventType!=="Earnings"||!/^https:\/\//.test(window.sourceUrl??""))
      throw new Error(`Invalid earnings asset provenance: ${record.eventId}`);
    const symbols=Object.values(window.universe??{}).flat();
    if(new Set(symbols).size!==symbols.length||symbols.length<11)
      throw new Error(`Incomplete earnings asset universe: ${record.eventId}`);
    const tracked=["NVDA","AMD","AVGO","TSM","MU","AAPL","MSFT","AMZN",
      "GOOGL","META","TSLA","QQQ","SMH","SOXX","I:COMP","I:SOX"];
    if(!tracked.every(symbol=>symbols.includes(symbol)))
      throw new Error(`Missing tracked earnings asset: ${record.eventId}`);
    const offsets=new Set();
    for(const session of window.sessions??[]){
      if(offsets.has(session.offset)&&session.offset!==null)throw new Error(`Duplicate earnings offset: ${record.eventId}`);
      offsets.add(session.offset);
      for(const symbol of symbols){
        if(!(symbol in session.assets))throw new Error(`Missing ${symbol} earnings slot: ${record.eventId}`);
        const asset=session.assets[symbol];
        if(asset===null)continue;
        if(!(asset.close>0)||!(asset.previousClose>0)||!Number.isFinite(asset.closeToClosePct)||
          Math.abs(asset.closeToClosePct-Math.round((asset.close/asset.previousClose-1)*10000)/100)>0.001)
          throw new Error(`Invalid ${symbol} earnings close: ${record.eventId}`);
      }
    }
    if(window.windowStatus==="complete"){
      if(window.sessions.length!==15||!Array.from({length:15},(_,i)=>i-7).every(offset=>offsets.has(offset)))
        throw new Error(`Incomplete full earnings window: ${record.eventId}`);
      for(const session of window.sessions)for(const symbol of symbols){
        const asset=session.assets[symbol];
        if(!asset)throw new Error(`Missing complete-window ${symbol} at T${session.offset}: ${record.eventId}`);
        if(session.offset>=1&&(!Number.isFinite(asset.cumulativeFromT0Pct)||
          !Number.isFinite(asset.sinceFirstReactionPct)))
          throw new Error(`Missing cumulative ${symbol} at T+${session.offset}: ${record.eventId}`);
      }
    }
  }
}
for(const id of Object.keys(history.eventIndex))if(!seen.has(id))throw new Error(`Index without result: ${id}`);
try {await stat(new URL("../public/event-results.json",import.meta.url));throw new Error("History must not be duplicated in public/");}
catch(error){if(error.code!=="ENOENT")throw error;}
for(const legacy of ["mu-nvda-earnings-2026.json","megacap-earnings-2026.json"]){
  try {await stat(new URL(`../history/${legacy}`,import.meta.url));throw new Error(`Earnings data still split across files: ${legacy}`);}
  catch(error){if(error.code!=="ENOENT")throw error;}
}
console.log(`Validated ${seen.size} historical results and ${earningsSummaryIds.size} consolidated earnings summaries.`);
