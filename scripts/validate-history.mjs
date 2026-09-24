#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
const root=new URL("../history/event-results.json",import.meta.url);
const history=JSON.parse(await readFile(root,"utf8"));
const seen=new Set();
for(const record of history.results){
  if(seen.has(record.eventId))throw new Error(`Duplicate historical result: ${record.eventId}`);
  seen.add(record.eventId);
  const index=history.eventIndex[record.eventId];
  if(!index||!/^\d{4}-\d{2}-\d{2}$/.test(index.eventDate))throw new Error(`Missing indexed date: ${record.eventId}`);
  if(record.status==="verified"&&(!record.actual||!/^https:\/\//.test(record.sourceUrl||"")))throw new Error(`Unverified actual/source: ${record.eventId}`);
  if(record.reactionWindows){
    for(const window of record.reactionWindows){
      if(!window.priceSourceUrl||!window.releaseTimeET)throw new Error(`Missing market-reaction provenance: ${record.eventId}`);
      for(const ticker of ["QQQ","NVDA","SMH"])for(const point of ["at15","at60"]){
        const value=window.assets?.[ticker]?.[point];
        if(value!==null && value!==undefined && (!Number.isFinite(value.pct)||!Number.isFinite(value.before?.close)||!Number.isFinite(value.after?.close)))
          throw new Error(`Invalid ${ticker} ${point}: ${record.eventId}`);
      }
    }
  }
}
for(const id of Object.keys(history.eventIndex))if(!seen.has(id))throw new Error(`Index without result: ${id}`);
try {await stat(new URL("../public/event-results.json",import.meta.url));throw new Error("History must not be duplicated in public/");}
catch(error){if(error.code!=="ENOENT")throw error;}
console.log(`Validated ${seen.size} historical results, unique event IDs and provenance.`);
