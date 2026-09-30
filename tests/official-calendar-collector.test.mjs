import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIcs,parseRss,compareEvents} from '../scripts/official-calendar-collector.mjs';
const source={key:'bea',url:'https://www.bea.gov/calendar'};
function fixture(start,title='Personal Income and Outlays\\, September 2026'){return `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:stable\r\nDTSTART${start}\r\nSUMMARY:${title}\r\nEND:VEVENT\r\nEND:VCALENDAR`;}
test('UTC times convert to Eastern across DST and folded summaries unfold',()=>{
 const a=parseIcs(fixture(':20261030T123000Z'),source)[0];assert.equal(a.timeET,'08:30');assert.equal(a.date,'2026-10-30');
 assert.equal(parseIcs(fixture(':20261125T133000Z'),source)[0].timeET,'08:30');
 assert.equal(parseIcs(fixture(';TZID=US-Eastern:20261030T083000','Personal Income and\r\n Outlays'),source)[0].title,'Personal Income andOutlays');
 assert.throws(()=>parseIcs('<html>access denied</html>',source));
});
test('proposals preserve identity and distinguish rescheduling from missing events',()=>{
 const obs=parseIcs(fixture(':20261030T123000Z'),source);
 const calendar={events:[{id:'2026-10-30-PCE',date:'2026-10-30',short:'PCE',event:'Core PCE',timeLabel:'08:30 ET'}]};
 assert.equal(compareEvents(obs,calendar)[0].action,'confirmed');
 assert.equal(compareEvents(obs,{events:[]})[0].action,'missing');
 assert.equal(compareEvents(obs,calendar,[{...obs[0],date:'2026-10-29'}])[0].action,'rescheduled');
 assert.deepEqual(compareEvents([],calendar),[]);
});
test('RSS filters policy announcements without pretending their significance is verified',()=>{
 const rss='<rss><item><title>FOMC policy statement</title><link>https://www.federalreserve.gov/test</link><pubDate>Wed, 30 Sep 2026 12:00:00 GMT</pubDate></item><item><title>Routine bank approval</title><link>https://www.federalreserve.gov/other</link></item></rss>';
 assert.equal(parseRss(rss,source).length,1);
 assert.throws(()=>parseRss('Forbidden',source));
});
