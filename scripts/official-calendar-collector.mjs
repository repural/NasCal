import assert from 'node:assert/strict';

export const sources = [
  {key:'marketwatch',kind:'economic-calendar',url:'https://www.marketwatch.com/economy-politics/calendar'},
  {key:'dol',kind:'claims-schedule',url:'https://oui.doleta.gov/unemploy/claims_arch.asp'},
  {key:'bls',kind:'ics',url:'https://www.bls.gov/schedule/news_release/bls.ics'},
  {key:'bea',kind:'ics',url:'https://www.bea.gov/news/schedule/ics/online-calendar-subscription.ics'},
  {key:'fed',kind:'rss',url:'https://www.federalreserve.gov/feeds/press_all.xml'},
  {key:'pmi',kind:'monitor',url:'https://pmi.spglobal.com/Public/Release/ReleaseDates?language=en'},
];
const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
export function parseEconomicCalendar(body, source, asOf) {
  const text=decode(body.replace(/<\/(?:tr|p|div)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/\u00a0/g,' '));
  assert(/Economic Calendar|Weekly Jobless Claims/i.test(text),'Economic calendar not readable');
  const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let date=null;const observations=[];
  for(const line of text.split('\n')) {
    const heading=line.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday),?\s+([A-Za-z]+)\.?\s+(\d{1,2})/i);
    if(heading){const month=months.indexOf(heading[1].slice(0,3).toLowerCase());if(month>=0){let year=Number(asOf.slice(0,4));if(Number(asOf.slice(5,7))===12&&month===0)year++;date=`${year}-${String(month+1).padStart(2,'0')}-${heading[2].padStart(2,'0')}`;}}
    const match=line.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s+(Weekly Jobless Claims|U\.? Michigan Prelim Consumer Survey|Federal Reserve Beige Book|Industrial Production(?:, M\/M%)?|Retail Sales|CPI|PPI)\b/i);
    if(!date||!match)continue;
    const hour=Number(match[1])%12+(/PM/i.test(match[3])?12:0);
    observations.push({sourceKey:source.key,sourceUrl:source.url,sourceUid:`${date}-${match[4]}`,title:match[4],date,timeET:`${String(hour).padStart(2,'0')}:${match[2]}`,status:'scheduled',confirmation:'secondary-calendar; official verification required'});
  }
  assert(observations.length,'No major calendar rows extracted; manual review required');
  return [...new Map(observations.map(e=>[e.sourceUid,e])).values()];
}
export function parseClaimsSchedule(body,source,asOf,endDate) {
  const text=decode(body.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
  assert(/Thursday morning at 8:30/i.test(text),'Claims schedule not readable');
  const exceptions=new Map();
  for(const match of text.matchAll(/(?:Monday|Tuesday|Wednesday|Thursday|Friday),\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/g)){
    const date=new Date(match[1]+' 12:00:00 UTC');assert(Number.isFinite(+date),'Invalid claims exception');
    const offset=(4-date.getUTCDay()+7)%7;
    const thursday=new Date(+date+offset*86400000).toISOString().slice(0,10);
    exceptions.set(thursday,date.toISOString().slice(0,10));
  }
  const entries=[];
  for(let date=new Date(asOf+'T12:00:00Z');date.toISOString().slice(0,10)<=endDate;date=new Date(+date+86400000)){
    if(date.getUTCDay()!==4)continue;
    const scheduled=exceptions.get(date.toISOString().slice(0,10))??date.toISOString().slice(0,10);
    if(scheduled<asOf)continue;
    entries.push({sourceKey:source.key,sourceUrl:source.url,sourceUid:`claims-${scheduled}`,title:'Unemployment Insurance Weekly Claims',date:scheduled,timeET:'08:30',status:'scheduled'});
  }
  return entries;
}
export function parseIcs(text, source) {
  assert(text.includes('BEGIN:VCALENDAR'),'Not an iCalendar feed');
  const unfolded=text.replace(/\r\n/g,'\n').replace(/\n[ \t]/g,'');
  return [...unfolded.matchAll(/BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g)].map(m=>{
    const fields={}; const params={};
    for(const line of m[1].split('\n')) {const i=line.indexOf(':');if(i<0)continue;const [key,...p]=line.slice(0,i).split(';');fields[key]=line.slice(i+1);params[key]=p.join(';');}
    const raw=fields.DTSTART;assert(/^\d{8}(T\d{6}Z?)?$/.test(raw??''),'Invalid DTSTART');
    let date=raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6,8),time=null;
    if(raw.includes('T')) {
      if(raw.endsWith('Z')) {const d=new Date(date+'T'+raw.slice(9,11)+':'+raw.slice(11,13)+':'+raw.slice(13,15)+'Z');date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);time=new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);}
      else {assert(/TZID=(US-Eastern|America\/New_York)/.test(params.DTSTART),'Unspecified/unsupported time zone');time=raw.slice(9,11)+':'+raw.slice(11,13);}
    }
    return {sourceKey:source.key,sourceUrl:source.url,sourceUid:fields.UID??null,title:(fields.SUMMARY??'').replace(/\\n/g,' ').replace(/\\([,;\\])/g,'$1'),date,timeET:time,status:fields.STATUS==='CANCELLED'?'cancelled':'scheduled'};
  });
}
export function family(title) {
  if(/jobless claims|weekly claims|Unemployment Insurance Weekly/i.test(title))return 'CLAIMS';
  if(/Michigan.*(?:Consumer|Sentiment)/i.test(title))return 'MICH';
  if(/Beige Book/i.test(title))return 'BEIGE BOOK';
  if(/Industrial Production/i.test(title))return 'IND PROD';
  if(/Retail Sales/i.test(title))return 'Retail';
  if(/Consumer Price Index/i.test(title))return 'CPI';
  if(/Producer Price Index/i.test(title))return 'PPI';
  if(/^Employment Situation/i.test(title))return 'NFP';
  if(/Job Openings and Labor Turnover/i.test(title))return 'JOLTS';
  if(/Employment Cost Index/i.test(title))return 'ECI';
  if(/Productivity and Costs/i.test(title))return 'Productivity';
  if(/Personal Income and Outlays/i.test(title))return 'PCE';
  if(/Gross Domestic Product/i.test(title))return 'GDP';
  return null;
}
export function compareEvents(observations, calendar, prior=[]) {
  return observations.map(o=>{
    const f=family(o.title);if(!f)return null;
    const existing=calendar.events.filter(e=>e.date===o.date&&(e.short.toUpperCase()===f.toUpperCase()||(f==='MICH'&&/Michigan/i.test(e.event))||(f==='NFP'&&/jobs|payroll|employment/i.test(e.event))));
    const old=prior.find(p=>p.sourceKey===o.sourceKey&&p.sourceUid&&p.sourceUid===o.sourceUid);
    let action=existing.length===1?'confirmed':existing.length>1?'ambiguous':'missing';
    if(o.status==='cancelled')action='cancelled';
    else if(old&&old.date!==o.date)action='rescheduled';
    else if(existing.length===1&&o.timeET&&!existing[0].timeLabel.includes(o.timeET))action='time-changed';
    return {...o,family:f,action,existingIds:existing.map(e=>e.id),previousDate:old?.date??null,requiresInterpretationReview:action!=='confirmed'};
  }).filter(Boolean);
}
export function parseRss(text, source) {
  assert(/<rss\b|<feed\b/.test(text),'Not an RSS feed');
  return [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{
    const get=k=>decode(m[1].match(new RegExp(`<${k}[^>]*>([\\s\\S]*?)<\\/${k}>`))?.[1]??'').trim();
    return {title:get('title'),url:get('link'),publishedAt:get('pubDate'),sourceUrl:source.url};
  }).filter(e=>/^https:\/\//.test(e.url)&&/rate|monetary|FOMC|policy|liquidity|emergency/i.test(e.title));
}
