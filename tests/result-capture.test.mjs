import test from 'node:test';import assert from 'node:assert/strict';
import {windowState,parseOutcome,indexMeasurement} from '../scripts/result-capture-utils.mjs';
import {timestamp} from '../scripts/market-reaction-utils.mjs';
test('price windows wait until due and never fake pre-open or after-hours index reactions',()=>{
  const e={eventDate:'2026-10-01',timeET:'10:00'},t=timestamp(e.eventDate,e.timeET);
  assert.equal(windowState(e,15,t+14*60000),'pending');assert.equal(windowState(e,15,t+15*60000),'due');
  assert.equal(windowState({...e,timeET:'08:30'},15,t),'outside-index-session');
  assert.equal(windowState({...e,timeET:'after-close'},60,timestamp(e.eventDate,'18:00')),'outside-index-session');
  assert.equal(indexMeasurement([],e,15),null);
});
test('outcome parser rejects a stale release date and keeps numerical PCE outcomes separate from forecast surprises',()=>{
  const text='September 30, 2026. Excluding food and energy, the PCE price index increased 0.2 percent. Excluding food and energy, the PCE price index increased 3.0 percent from one year ago.';
  assert.equal(parseOutcome('core-pce',text,'2026-10-29'),null);
  assert.equal(parseOutcome('gdp-final','x'.repeat(600)+' Real gross domestic product (GDP) increased at an annual rate of 2.2 percent. Next release: October 29, 2026','2026-10-29'),null);
  assert.equal(parseOutcome('core-pce',text,'2026-09-30').metrics.momPct,0.2);
  assert.equal(parseOutcome('core-pce',text,'2026-09-30').metrics.consensusMomPct,null);
  assert.equal(parseOutcome('core-pce','September 30, 2026 missing values','2026-09-30'),null);
});
