import assert from 'node:assert/strict';

export const officialDomains = ['bls.gov','bea.gov','census.gov','federalreserve.gov','treasury.gov','treasurydirect.gov','whitehouse.gov','commerce.gov','bis.gov','ustr.gov','state.gov','sec.gov','fec.gov','eac.gov','congress.gov','spglobal.com','ismworld.org','cmegroup.com','cboe.com','nasdaq.com','nyse.com','micron.com','micron.gcs-web.com','nvidia.com','amd.com','broadcom.com','tsmc.com','apple.com','microsoft.com','amazon.com','abc.xyz','google.com','meta.com','tesla.com','fmprc.gov.cn'];
export const wireDomains = ['reuters.com','apnews.com','bloomberg.com'];
const belongs = (host, domains) => domains.some(d => host === d || host.endsWith('.'+d));
export function sourceKind(url) {
  const parsed = new URL(url);
  assert.equal(parsed.protocol,'https:','Sources must use HTTPS');
  assert(!parsed.username && !parsed.password, 'Invalid source URL');
  return belongs(parsed.hostname,officialDomains)?'official':belongs(parsed.hostname,wireDomains)?'wire':null;
}
export function requireConfirmation(sources, retrievedUrls) {
  assert(Array.isArray(sources) && sources.length, 'Missing confirmation sources');
  const verified = sources.filter(s=>retrievedUrls.has(s.url));
  assert.equal(verified.length,sources.length,'A source was not retrieved by web research');
  const official=verified.some(s=>sourceKind(s.url)==='official');
  const wires=new Set(verified.filter(s=>sourceKind(s.url)==='wire').map(s=>new URL(s.url).hostname.replace(/^www\./,'')));
  assert(official || wires.size>=2,'Require official confirmation or two independent news wires');
}
export function validateCalendar(data) {
  assert.equal(data.schemaVersion,1);
  assert(Array.isArray(data.events) && data.events.length, 'Empty calendars cannot replace the last good version');
  const ids=new Set(); const identities=new Set();
  for(const e of data.events) {
    for(const k of ['id','date','short','event','type','importance','explanation','expects','positive','negative','watch','window','bias','uncertainty','timeLabel']) assert(typeof e[k]==='string' && e[k].trim(),`Missing ${k} on ${e.id}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(e.date) && new Date(e.date+'T12:00:00Z').toISOString().slice(0,10)===e.date,'Invalid date');
    assert.equal(e.id,`${e.date}-${e.short}`,'ID must match the historical date/short convention');
    assert(!ids.has(e.id),'Duplicate event ID');ids.add(e.id);
    const identity=e.date+'|'+e.event.toLowerCase().replace(/[^a-z0-9]/g,'');
    assert(!identities.has(identity),'Duplicate event entity');identities.add(identity);
    assert(!e.short.includes(' + ') && e.type!=='Mixed','Split unrelated events');
    assert(['Macro','Earnings','Rates','Inflation','Fed','Market','Politics'].includes(e.type));
    assert(['High','Critical'].includes(e.importance));
    assert(['Bullish','Bearish','Neutral'].includes(e.bias));
    assert(['Low','Medium','High'].includes(e.uncertainty));
    if(e.sourceUrl)assert.equal(new URL(e.sourceUrl).protocol,'https:');
    for(const source of e.sources??[])assert.equal(new URL(source.url).protocol,'https:');
    if(e.short.toUpperCase().includes('FLASH PMI'))assert(e.timeLabel.includes('09:45'),'U.S. Flash PMI must be shown at 09:45 ET');
  }
  return data;
}
export function applyChanges(current, changes, retrieved, asOf, endDate) {
  const map=new Map(current.events.map(e=>[e.id,{...e}]));
  for(const change of changes) {
    assert(['new','update','cancel'].includes(change.action),'Invalid change action');
    const e=change.event;requireConfirmation(e.sources,retrieved);
    assert(e.date>=asOf && e.date<=endDate,'Change outside the next 90 days');
    const oldId=change.previousId??e.id, old=map.get(oldId);
    if(change.action!=='new')assert(old,'Updated or cancelled event must already exist');
    if(change.action==='new')assert(!map.has(e.id),'New event already exists');
    if(oldId!==e.id)assert(!map.has(e.id),'Date change duplicates another event');
    if(oldId!==e.id)map.delete(oldId);
    map.set(e.id,{...old,...e,isNew:change.action==='new',isUpdated:change.action!=='new',status:change.action==='cancel'?'cancelled':'scheduled',lastUpdated:asOf,sourceUrl:e.sources[0].url});
  }
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function semanticCalendar(data) {
  return JSON.stringify(data.events.map(({lastUpdated,interpretationAsOf,...event})=>event));
}
export function monthsFor(date, count=4) {
  const d=new Date(date+'T12:00:00Z');
  return Array.from({length:count},(_,i)=>{
    const first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+i,1));
    return {name:first.toLocaleString('en-US',{month:'long',timeZone:'UTC'}),year:first.getUTCFullYear(),month:first.getUTCMonth(),days:new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate(),offset:(first.getUTCDay()+6)%7};
  });
}
