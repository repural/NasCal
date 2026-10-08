import test from 'node:test';
import assert from 'node:assert/strict';
import {loadHistory} from '../data/history-feed.mjs';
test('live history supersedes the bundled snapshot and failures preserve fallback',async()=>{
 const fallback={updatedAt:'2026-10-01',eventIndex:{},results:[]};
 const current={updatedAt:'2026-10-08',eventIndex:{latest:{}},results:[{eventId:'latest'}]};
 const live=await loadHistory(fallback,async(url,options)=>{
  assert.match(url,/repural\/NasCal\/main\/history\/event-results.json/);
  assert.equal(options.cache,'no-store');return Response.json(current);
 });
 assert.deepEqual(live,{archive:current,source:'github-main'});
 for(const request of [async()=>{throw Error('Outage');},async()=>Response.json({}),async()=>new Response('',{status:403}),async()=>Response.json({...fallback,updatedAt:'2026-09-01'})]){
  assert.deepEqual(await loadHistory(fallback,request),{archive:fallback,source:'bundled-fallback'});
 }
});
