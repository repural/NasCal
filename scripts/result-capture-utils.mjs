import {timestamp,measure} from './market-reaction-utils.mjs';
export const etParts=now=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
export function releaseTimestamp(event) {
  const time=event.timeET==='after-close'?'16:05':event.timeET==='before-open'?'08:00':event.timeET;
  return /^\d\d:\d\d$/.test(time??'')?timestamp(event.eventDate,time):null;
}
export function windowState(event,minutes,now) {
  const release=releaseTimestamp(event);
  if(release===null)return 'no-single-release-time';
  if(now<release+minutes*60000)return 'pending';
  const p=etParts(release),minute=Number(p.hour)*60+Number(p.minute);
  // No index baseline exists before 09:30 or after 16:00. Never substitute ETF quotes.
  if(minute<570||minute>=960||minute+minutes>960)return 'outside-index-session';
  return 'due';
}
export function indexMeasurement(rows,event,minutes) {
  return measure(new Map(rows.map(b=>[b.t,b.c])),releaseTimestamp(event),minutes);
}
export function publishedOn(text,date) {
  const d=new Date(date+'T12:00:00Z');
  const full=d.toLocaleString('en-US',{month:'long',timeZone:'UTC'})+' '+d.getUTCDate()+', '+d.getUTCFullYear();
  const occurrence=text.indexOf(full);
  if(occurrence<0)return false;
  const lead=text.slice(Math.max(0,occurrence-160),occurrence);
  // A future date in a "Next release" footer does not verify the current outcome.
  if(/next release[^.]*$/i.test(lead))return false;
  return occurrence<500||/embargoed|for release|current release|released|issued/i.test(lead);
}
export function parseOutcome(family,text,date) {
  if(!publishedOn(text,date))return null;
  if(family==='core-pce'){
    const all=[...text.matchAll(/Excluding food and energy, the PCE price index (increased|decreased) ([\d.]+) percent(?: from one year ago)?/gi)];
    if(!all.length)return null;
    const mom=Number(all[0][2])*(all[0][1].toLowerCase()==='decreased'?-1:1);
    return {actual:`Core PCE +${mom}% month on month${all[1]?`; +${all[1][2]}% year on year`:''}`,metrics:{metric:'core-pce',momPct:mom,consensusMomPct:null,surpriseMomPp:null}};
  }
  if(family?.startsWith('gdp-')){
    const m=text.match(/Real gross domestic product \(GDP\) (increased|decreased) at an annual rate of ([\d.]+) percent/i);
    if(m)return {actual:`Real GDP ${m[1]} ${m[2]}% at an annualized rate.`,metrics:{metric:family,annualizedPct:Number(m[2])*(m[1].toLowerCase()==='decreased'?-1:1)}};
  }
  if(family==='ism-manufacturing'||family==='ism-services'){
    const m=text.match(new RegExp((family==='ism-services'?'Services':'Manufacturing')+' PMI[^a-z0-9]{0,12}(?:at|registered|was)?\\s*([0-9]+\\.[0-9]+)\\s*(?:%|percent)','i'));
    if(m&&Number(m[1])<=100)return {actual:`${family==='ism-services'?'Services':'Manufacturing'} PMI ${m[1]}.`,metrics:{metric:family,pmi:Number(m[1])}};
  }
  if(family==='employment-report'){
    const m=text.match(/Total nonfarm payroll employment (?:increased|rose|declined|decreased) by ([\d,]+)[\s\S]{0,120}?unemployment rate (?:was|remained|changed little at|edged up to|edged down to) ([\d.]+) percent/i);
    if(m)return {actual:`Nonfarm payroll change ${m[1]}; unemployment ${m[2]}%.`,metrics:{metric:family,unemploymentPct:Number(m[2])}};
  }
  if(family==='cpi'||family==='ppi'){
    const m=text.match(family==='cpi'?/Consumer Price Index for All Urban Consumers[^.]{0,80}?(?:increased|rose|declined|decreased) ([\d.]+) percent[^.]{0,80}?seasonally adjusted/i:/Producer Price Index for final demand[^.]{0,80}?(?:increased|rose|declined|decreased) ([\d.]+) percent[^.]{0,80}?seasonally adjusted/i);
    if(m)return {actual:`${family.toUpperCase()} official headline: ${m[0].replace(/\s+/g,' ')}.`,metrics:{metric:family}};
  }
  return null;
}

// Secondary-source fallback: only exact dated table rows, never forecasts or dash placeholders.
export function parseMarketWatchOutcome(html,eventDate,family,asOf) {
  if(eventDate.slice(0,4)!==asOf.slice(0,4))return null;
  const labels={
    'weekly-jobless-claims':/^Weekly Jobless Claims$/i,
    'cpi':/^CPI$/i,'ppi':/^PPI$/i,'retail-sales':/^Retail Sales$/i,
    'industrial-production':/^Industrial Production,?\s*M\/M%$/i,
    'michigan-sentiment-preliminary':/^U\.? Michigan Prelim Consumer Survey$/i,
    'ism-manufacturing':/^ISM (?:Report On Business )?Manufacturing PMI$/i,
    'ism-services':/^ISM (?:Report On Business )?Services PMI$/i,
  };
  const pattern=labels[family];if(!pattern)return null;
  const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];let date=null;const matches=[];
  for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>clean(m[1]));
    const heading=cells.join(' ').match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday),?\s+([A-Za-z]+)\.?\s+(\d{1,2})/i);
    if(heading){const month=months.indexOf(heading[1].slice(0,3).toLowerCase());date=month<0?null:`${asOf.slice(0,4)}-${String(month+1).padStart(2,'0')}-${heading[2].padStart(2,'0')}`;continue;}
    if(date!==eventDate)continue;
    const n=cells.findIndex(c=>pattern.test(c));if(n<0||!/^\d{1,2}:\d{2}\s*[AP]M$/i.test(cells[n-1]??''))continue;
    const [period,actual,forecast,previous]=cells.slice(n+1,n+5);
    if(!/^[+−-]?\d[\d,.]*(?:%|K|M|B)?$/i.test(actual??''))continue;
    const valid=v=>/^[+−-]?\d[\d,.]*(?:%|K|M|B)?$/i.test(v??'');
    matches.push({actual:`${cells[n]}: ${actual} (${period}).`,previous:valid(previous)?previous:null,expected:valid(forecast)?forecast:null,metrics:{metric:family,referencePeriod:period,actualRaw:actual,consensusRaw:valid(forecast)?forecast:null,previousRaw:valid(previous)?previous:null}});
  }
  const unique=[...new Map(matches.map(m=>[JSON.stringify(m),m])).values()];
  return unique.length===1?unique[0]:null;
}
