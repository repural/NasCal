import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardMonths,visibleCalendarEvents} from '../data/calendar-window.mjs';
test('prior month stays through the 7th and disappears on the 8th',()=>{
  for(const day of ['01','07'])assert.deepEqual(dashboardMonths('2026-10-'+day).map(m=>m.month),[8,9,10,11,0]);
  assert.deepEqual(dashboardMonths('2026-10-08').map(m=>m.month),[9,10,11,0]);
  assert.deepEqual(dashboardMonths('2027-01-01').map(m=>[m.year,m.month]),[[2026,11],[2027,0],[2027,1],[2027,2],[2027,3]]);
  assert.equal(dashboardMonths('2027-01-01')[0].offset,1);
});
test('past dates retain event rows, current entries win and old dates are hidden',()=>{
  const data={recentEvents:[{id:'sep',date:'2026-09-24',name:'stored'},{id:'aug',date:'2026-08-28'}],events:[{id:'sep',date:'2026-09-24',name:'updated'},{id:'oct',date:'2026-10-01'},{id:'feb',date:'2027-02-01'}]};
  assert.deepEqual(visibleCalendarEvents(data,'2026-10-07').map(e=>e.id),['sep','oct']);
  assert.equal(visibleCalendarEvents(data,'2026-10-07')[0].name,'updated');
  assert.deepEqual(visibleCalendarEvents(data,'2026-10-08').map(e=>e.id),['oct']);
});
