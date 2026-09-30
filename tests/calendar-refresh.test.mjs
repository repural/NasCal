import test from 'node:test';
import assert from 'node:assert/strict';
import {applyChanges,requireConfirmation,monthsFor,validateCalendar} from '../scripts/calendar-refresh-utils.mjs';
import {renderCalendarHtml} from '../scripts/render-calendar-html.mjs';
const e={id:'2026-10-23-FLASH PMI',date:'2026-10-23',short:'FLASH PMI',event:'U.S. Flash PMI',type:'Macro',importance:'Critical',explanation:'Private-sector survey',expects:'No reliable consensus yet',positive:'Cooling prices and resilient activity',negative:'Prices accelerate',watch:'Prices and employment',window:'Release through cash close',bias:'Neutral',uncertainty:'High',timeLabel:'09:45 ET · 16:45 Istanbul',sources:[{url:'https://www.spglobal.com/calendar',title:'Official calendar'}]};
test('unretrieved and single-wire claims cannot be published',()=>{
  assert.throws(()=>requireConfirmation(e.sources,new Set()));
  assert.throws(()=>requireConfirmation([{url:'https://www.reuters.com/example'}],new Set(['https://www.reuters.com/example'])));
  requireConfirmation(e.sources,new Set(e.sources.map(s=>s.url)));
});
test('date changes replace the entity and cancellations retain the entry',()=>{
  const current={events:[e]};const moved={...e,id:'2026-10-22-FLASH PMI',date:'2026-10-22'};const sources=new Set(e.sources.map(s=>s.url));
  const updated=applyChanges(current,[{action:'update',previousId:e.id,event:moved}],sources,'2026-09-30','2026-12-29');
  assert.equal(updated.length,1);assert.equal(updated[0].id,moved.id);
  const cancelled=applyChanges({events:updated},[{action:'cancel',event:moved}],sources,'2026-09-30','2026-12-29');assert.equal(cancelled[0].status,'cancelled');
});
test('duplicates, combined events and incorrect PMI time are rejected',()=>{
  validateCalendar({schemaVersion:1,events:[e]});
  assert.throws(()=>validateCalendar({schemaVersion:1,events:[e,e]}));
  assert.throws(()=>validateCalendar({schemaVersion:1,events:[{...e,type:'Mixed'}]}));
  assert.throws(()=>validateCalendar({schemaVersion:1,events:[{...e,timeLabel:'10:00 ET'}]}));
});
test('calendar crosses year boundary with Monday-aligned dates',()=>{
  const ms=monthsFor('2026-12-01');assert.equal(ms[1].year,2027);assert.equal(ms[1].offset,4);assert.equal(ms[2].days,28);
});
test('standalone HTML retains date navigation, escapes embedded content and checks central data only',()=>{
  const html=renderCalendarHtml({schemaVersion:1,events:[{...e,expects:'</script><script>alert(1)</script>'}],asOf:'2026-09-30',updatedAt:'2026-09-30T08:00:00Z'},'body{color:navy}');
  assert(!html.includes('</script><script>alert'));assert.match(html,/data-event-date/);assert.match(html,/calendar-live\.json/);assert(!html.includes('api.openai.com'));
});
