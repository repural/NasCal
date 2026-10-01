"use client";

import { Fragment, useEffect, useState } from "react";
import resultData from "../history/event-results.json";
import { today as initialToday } from "../data/calendar";
import calendarSeed from "../data/calendar-live.json";
import { validFeed, calendarMonths, type CalendarEvent, type CalendarFeed } from "../data/calendar-feed";
import { earningsBenchmark, earningsHistory, earningsHistoryAsOf } from "../data/earnings-history";
import { historicalPeers } from "../data/event-family.mjs";
import { visibleCalendarEvents } from "../data/calendar-window.mjs";
import {releaseTimestamp} from '../scripts/result-capture-utils.mjs';
type HistoricalResult = {
  eventId:string;
  status:string;
  capture?:Record<string,{priorClose?:string;at15?:string;at60?:string;dayClose?:string;error?:string}>;
  previous?:string|null;
  expected?:string|null;
  actual?:string|null;
  surprise?:string|null;
  outcomeMetrics?: { metric: string; referenceMonth: string; momPct: number; consensusMomPct: number|null; surpriseMomPp: number|null; sourceUrl: string };
  explanation?:string|null;
  sourceUrl?:string|null;
  reactionStatus?:string|null;
  qqq15m?: string | null;
  qqq1h?: string | null;
  qqqReaction?: { sourceUrl: string } | null;
  reactionWindows?: Array<{ label: string; releaseTimeET: string; assets?: Record<string, { at15?: { pct: number; before?: { minuteET: string }; after?: { minuteET: string } } | null; at60?: { pct: number; before?: { minuteET: string }; after?: { minuteET: string } } | null }>; priceSourceUrl?: string }> | null;
  indexLevels?: Record<string, { priorClose?: {date:string;value:number}|null; dayOpen?: {date:string;value:number}|null; beforeRelease?: {close:number;minuteET:string}|null; at15?: {close:number;minuteET:string}|null; at60?: {close:number;minuteET:string}|null; dayClose?: {date:string;value:number}|null; intradayStatus?:string; releaseLabel?:string; releaseTimeET?:string; sourceUrl?:string }> | null;
  indexWindows?: Array<{label:string;releaseTimeET:string;nasdaq:{at15:{close:number}|null;at60:{close:number}|null};sox:{at15:{close:number}|null;at60:{close:number}|null}}> | null;
};

const level=(value:number|undefined)=>value == null ? "—" : new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(value);
const pct=(after:number,before:number)=>100*(after/before-1);
const signed=(value:number)=>`${value>=0?"+":""}${value.toFixed(2)}%`;
const levelChange=(value:number|undefined,before:number|undefined)=>value == null ? "—" : `${level(value)}${before == null ? "" : ` (${signed(pct(value,before))})`}`;
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;};
function earningsHistoricalAnalysis(eventDate:string, ticker:string, result:HistoricalResult|undefined):string|null {
  const history=earningsHistory[ticker];
  if(!history) return null;
  const earlier=history.filter(event=>event.date<eventDate);
  const current=history.find(event=>event.date===eventDate);
  const benchmark=earningsBenchmark[ticker];
  const lines:string[]=[];
  const windows=(event:typeof history[number])=>{
    const lead=event.session==="after_close"?"T−7→T0":"T−7→T−1";
    const first=event.session==="after_close"?"T0→T+1":"T−1→T0";
    const follow=event.session==="after_close"?"T+1→T+7":"T0→T+7";
    return `${lead} stock ${signed(event.leadStock)} vs ${benchmark} ${signed(event.leadBenchmark)}; first reaction (${first}) stock ${signed(event.firstStock)} vs ${benchmark} ${signed(event.firstBenchmark)}; follow-through (${follow}) stock ${signed(event.followStock)} vs ${benchmark} ${signed(event.followBenchmark)}.`;
  };
  if(result?.status==="verified") lines.push(`Recorded outcome: ${result.actual}`);
  if(current) lines.push(`This report (${current.date}): ${windows(current)}`);
  if(!earlier.length) {
    lines.push(`No earlier ${ticker} earnings observations in the archive as of ${earningsHistoryAsOf}.`);
    return lines.join("\n");
  }
  lines.push(`${earlier.length} earlier ${ticker} earnings report${earlier.length===1?"":"s"} (archive through ${earningsHistoryAsOf}; benchmark ${benchmark}):`);
  for(const event of earlier.slice(-3)) lines.push(`${event.date}: ${windows(event)}`);
  lines.push(`In this sample, ${earlier.filter(event=>event.leadStock>0).length}/${earlier.length} stocks rose before the release, ${earlier.filter(event=>event.firstStock>0).length}/${earlier.length} rose on the first reaction session, and ${earlier.filter(event=>event.followStock>0).length}/${earlier.length} gained in the subsequent sessions. This small sample describes historical moves, not a forecast.`);
  lines.push(earlier[0].session==="after_close"
    ? "For after-close earnings, T0 closes before results and T+1 is the first regular-session reaction."
    : "For before-open earnings, T0 already includes the first regular-session reaction.");
  if(ticker==="MU"&&eventDate==="2026-09-30") lines.push("At the coming report, PCE and GDP share T0; ISM Manufacturing lands during T+1. Those sessions cannot be attributed to Micron alone.");
  return lines.join("\n");
}

function historicalAnalysis(event:CalendarEvent,result:HistoricalResult|undefined,all:HistoricalResult[],index:typeof resultData.eventIndex){
  const {id:eventId,short,type:eventType}=event;
  const eventDate=eventId.slice(0,10);
  if(eventType==="Earnings") {
    const earnings=earningsHistoricalAnalysis(eventDate,short.toUpperCase(),result);
    if(earnings) return earnings;
  }
  const {family,peers}=historicalPeers(event,all,index);
  const lines=[];
  if(result?.status==="verified"){
    lines.push(`Recorded outcome: ${result.actual}`);
    for(const [name,label] of [["nasdaq","Nasdaq Composite"],["sox","SOX (PHLX Semiconductor)"]]){
      const levels=result.indexLevels?.[name], before=levels?.priorClose?.value,close=levels?.dayClose?.value;
      if(before&&close)lines.push(`${label}: ${level(before)} previous close → ${level(close)} event-day close (${signed(pct(close,before))}).`);
    }
    if(result.reactionStatus==="headline-driven-no-single-release")lines.push("Several statements and other market catalysts overlapped. A single +15-minute or +1-hour effect cannot be attributed to this event.");
  }
  if(!peers.length){lines.push(family?"No earlier verified occurrences of this event family are stored, so a comparable historical average is unavailable.":"This event has no mapped historical family yet; comparable historical statistics are unavailable.");return lines.join("\n");}
  lines.push(`${peers.length} earlier verified ${family} release${peers.length===1?"":"s"} in the archive. Day-close and intraday sample sizes differ according to available index data.`);
  for(const [name,label] of [["nasdaq","Nasdaq Composite"],["sox","SOX (PHLX Semiconductor)"]]){
    const observations=peers.flatMap(r=>{const p=r.indexLevels?.[name]?.priorClose?.value,c=r.indexLevels?.[name]?.dayClose?.value;return p&&c?[pct(c,p)]:[];});
    if(!observations.length){lines.push(`${label}: no comparable prior-close to day-close index observations yet.`);continue;}
    lines.push(`${label} (whole trading day, ${observations.length}/${peers.length} releases): ${observations.filter(v=>v>0).length} sessions closed higher; median prior-close to event-day-close move ${signed(median(observations))}.`);
    for(const [field,window] of [["at15","+15 minutes"],["at60","+1 hour"]] as const){
      const measured=peers.flatMap(r=>{const levels=r.indexLevels?.[name], before=levels?.beforeRelease?.close, after=levels?.[field]?.close;return before&&after?[{date:r.eventId.slice(0,10),move:pct(after,before)}]:[];});
      const moves=measured.map(observation=>observation.move);
      if(!moves.length){lines.push(`${label} ${window}: no comparable index minute bars among ${peers.length} earlier releases.`);continue;}
      const sample=moves.length===1?`single observation on ${measured[0].date}`:`${moves.filter(v=>v>0).length} of ${moves.length} rose`;
      lines.push(`${label} ${window} (${moves.length}/${peers.length} releases; ${sample}): ${moves.length===1?signed(moves[0]):`median ${signed(median(moves))}`}.`);
    }
  }
  if(family?.toLowerCase().includes("pce")){
    const withOutcome=peers.filter(r=>r.outcomeMetrics?.metric==="core-pce"&&Number.isFinite(r.outcomeMetrics.momPct));
    if(withOutcome.length){
      lines.push(`Core PCE outcome by reported monthly change (${withOutcome.length}/${peers.length} releases with BEA values): these are printed inflation levels, not surprises versus forecasts. Contemporaneous consensus remains unverified in this archive.`);
      for(const [bucket,match] of [["0.1–0.2%",(v:number)=>v<=0.2],["0.3–0.4%",(v:number)=>v>=0.3]] as const){
        const group=withOutcome.filter(r=>match(r.outcomeMetrics!.momPct));
        if(!group.length)continue;
        const daily=group.flatMap(r=>{const l=r.indexLevels?.nasdaq;return l?.priorClose?.value&&l?.dayClose?.value?[pct(l.dayClose.value,l.priorClose.value)]:[];});
        lines.push(`Core PCE ${bucket} (${group.length} releases): Nasdaq Composite whole-day ${daily.filter(v=>v>0).length}/${daily.length} rose, median ${signed(median(daily))}.`);
        const premarket=group.filter(r=>r.indexLevels?.nasdaq?.releaseTimeET==="08:30");
        for(const symbol of ["QQQ","SMH"]){
          const summaries=[];
          for(const [field,label,minute] of [["at15","+15m","08:44"],["at60","+1h","09:29"]] as const){
            const moves=premarket.flatMap(r=>{const point=r.reactionWindows?.find(w=>w.releaseTimeET==="08:30")?.assets?.[symbol]?.[field];return point?.before?.minuteET==="08:29"&&point?.after?.minuteET===minute&&Number.isFinite(point.pct)?[point.pct]:[];});
            summaries.push(moves.length?`${label} ${moves.filter(v=>v>0).length}/${moves.length} rose, median ${signed(median(moves))}`:`${label} unavailable`);
          }
          lines.push(`${symbol} 08:30 premarket (${premarket.length} releases): ${summaries.join("; ")}.`);
        }
      }
    }
    const early=peers.filter(r=>r.indexLevels?.nasdaq?.releaseTimeET==="08:30");
    if(early.length){
      lines.push(`${early.length} of ${peers.length} earlier PCE releases occurred at 08:30 ET, before Nasdaq Composite and SOX cash-index minute bars begin. Their whole-day moves cannot substitute for release-window returns.`);
      lines.push("Separate premarket ETF evidence from those 08:30 releases: QQQ follows the Nasdaq-100, and SMH is a semiconductor ETF. Neither is the Nasdaq Composite or SOX. Exact Massive bars compare 08:29 to 08:44 ET (+15 minutes) and to 09:29 ET (+1 hour), when available.");
      for(const [symbol,label] of [["QQQ","QQQ"],["SMH","SMH"]]){
        for(const [field,window] of [["at15","+15 minutes"],["at60","+1 hour"]] as const){
          const moves=early.flatMap(r=>{
            const point=r.reactionWindows?.find(w=>w.releaseTimeET==="08:30")?.assets?.[symbol]?.[field];
            return point?.before?.minuteET==="08:29"&&point?.after?.minuteET===(field==="at15"?"08:44":"09:29")&&Number.isFinite(point.pct)?[point.pct]:[];
          });
          if(moves.length)lines.push(`${label} premarket ${window} (${moves.length}/${early.length} releases): ${moves.filter(v=>v>0).length} rose; median ${signed(Math.round(median(moves)*100)/100)}.`);
          else lines.push(`${label} premarket ${window}: no exact ETF minute-bar pairs among the ${early.length} releases.`);
        }
      }
    }
  }
  lines.push("These are associations across whole trading days, not isolated event effects or a forecast. Other releases and headlines may overlap.");
  return lines.join("\n");
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Calendar({ name, year, month, days, offset, events, onSelect }: ReturnType<typeof calendarMonths>[number] & { events: CalendarEvent[]; onSelect: (date: string) => void }) {
  const cells: (number | null)[] = Array.from({ length: offset + days }, (_, i) => i < offset ? null : i - offset + 1);
  while (cells.length % 7) cells.push(null);
  return <article className="calendar-card">
    <div className="month-heading"><h2>{name}</h2><span>{year}</span></div>
    <div className="calendar-grid weekday-row">{weekdays.map(day => <div key={day}>{day}</div>)}</div>
    <div className="calendar-grid days-grid">{cells.map((day, index) => {
      const key = day ? `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}` : "";
      const dayEvents = events.filter(item => item.date === key && item.status !== "cancelled");
      const hasCritical = dayEvents.some(item => item.importance === "Critical");
      const isInteractive = dayEvents.length > 0;
      return <div
        key={index}
        className={`day-cell ${isInteractive ? "has-event" : ""} ${hasCritical ? "critical" : ""}`}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? `View ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} on ${name} ${day}` : undefined}
        onClick={isInteractive ? () => onSelect(key) : undefined}
        onKeyDown={isInteractive ? event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(key);
          }
        } : undefined}
      >
        {day && <><span className="day-number">{day}</span>{isInteractive && <><span className="event-dot" aria-hidden="true">×</span><span className="event-short">{dayEvents.map(item => item.short).join(" · ")}</span></>}</>}
      </div>;
    })}</div>
  </article>;
}

const prettyDate = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));


export default function Home() {
  const [today,setToday]=useState(initialToday);
  useEffect(()=>{
    const update=()=>setToday(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
    update();const timer=setInterval(update,60000);return ()=>clearInterval(timer);
  },[]);
  const monthConfig=calendarMonths(today);
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});
  const [calendar, setCalendar] = useState<CalendarFeed>(calendarSeed as CalendarFeed);
  useEffect(() => {
    const key="nascal-calendar-v1";
    let active=true;
    try {
      const cached=JSON.parse(localStorage.getItem(key)??"null");
      if(validFeed(cached?.data)&&cached.data.updatedAt>=calendarSeed.updatedAt){
        setCalendar(cached.data);
        if(Date.now()-cached.fetchedAt<60*60*1000)return;
      }
    } catch { /* The bundled snapshot remains usable offline. */ }
    fetch("https://raw.githubusercontent.com/repural/NasCal/main/data/calendar-live.json")
      .then(r=>{if(!r.ok)throw new Error("Calendar feed unavailable");return r.json();})
      .then(data=>{if(active&&validFeed(data)&&data.updatedAt>=calendarSeed.updatedAt){setCalendar(data);try{localStorage.setItem(key,JSON.stringify({fetchedAt:Date.now(),data}));}catch{/* Cache is optional. */}}})
      .catch(()=>{});
    return ()=>{active=false;};
  },[]);
  const eventView=visibleCalendarEvents(calendar,today);
  const events=eventView.filter(e=>e.status!=="cancelled");
  const eventTimes=Object.fromEntries(eventView.map(e=>[e.id,e.timeLabel]));

  const [archive, setArchive] = useState<typeof resultData>(resultData);
  useEffect(() => {
    const cacheKey="nascal-history-v1";
    let active=true;
    try {
      const cached=JSON.parse(localStorage.getItem(cacheKey)??"null");
      // The deployed archive is newer than a saved browser copy after a Site update.
      // Prefer it until GitHub confirms a strictly newer archive.
      const cacheIsNewer=cached?.data?.eventIndex && Array.isArray(cached.data.results)
        && cached.data.lastUpdated > resultData.lastUpdated;
      if(cacheIsNewer)setArchive(cached.data);
    } catch { /* Use the bundled archive when the cache cannot be read. */ }
    const refresh=()=>fetch("https://raw.githubusercontent.com/repural/NasCal/main/history/event-results.json",{cache:'no-cache'})
      .then(response=>{if(!response.ok)throw new Error("History unavailable");return response.json();})
      .then(data=>{if(!active||!data?.eventIndex||!Array.isArray(data.results))return;setArchive(data);try{localStorage.setItem(cacheKey,JSON.stringify({fetchedAt:Date.now(),data}));}catch{ /* Storage is optional. */ }})
      .catch(()=>{});
    refresh();const timer=setInterval(()=>{if(!document.hidden)refresh();},5*60000);
    return ()=>{active=false;clearInterval(timer);};
  },[]);
  const results = new Map<string, HistoricalResult>(archive.results.map(result => [result.eventId, result]));
  const verifiedResults = archive.results.filter(result => result.status === "verified").length;
  const eventFamilies = new Set(Object.values(archive.eventIndex).map(item => item.eventKey)).size;
  const goToEvents = (date: string) => {
    const matchingRows = Array.from(document.querySelectorAll<HTMLElement>(`tr[data-event-date="${date}"]`));
    if (!matchingRows.length) return;

    document.querySelectorAll("tr.event-highlight").forEach(row => row.classList.remove("event-highlight"));
    matchingRows.forEach(row => row.classList.add("event-highlight"));
    matchingRows[0].scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => matchingRows.forEach(row => row.classList.remove("event-highlight")), 3000);
  };

  return <main>
    <header className="topbar">
      <div className="brand-mark"><span>N</span></div>
      <div><p className="eyebrow">MARKET INTELLIGENCE</p><h1>Nasdaq event calendar</h1></div>
      <div className="date-range"><span>{monthConfig[0].name.slice(0,3).toUpperCase()}</span><strong>→</strong><span>{monthConfig.at(-1)?.name.slice(0,3).toUpperCase()} {monthConfig.at(-1)?.year}</span></div>
    </header>
    <section className="intro">
      <div><p className="kicker">FORWARD RISK MAP</p><h2>Know the days that can<br/>change the tape.</h2></div>
      <div className="intro-copy"><p>Significant macro releases, Federal Reserve decisions, Treasury auctions, AI earnings signals and the U.S. midterms—all in one decision-ready view.</p><div className="legend"><span><i className="legend-x">×</i> Significant event</span><span><i className="critical-swatch"></i> Critical risk</span></div></div>
    </section>
    <section className="calendar-section" aria-label="Event calendar">{monthConfig.map(month => <Calendar key={`${month.year}-${month.month}`} {...month} events={events} onSelect={goToEvents} />)}</section>
    <section className="history-strip" aria-label="Historical results dataset">
      <div><p className="kicker">ANALYSIS ARCHIVE</p><h2>Every result becomes reusable evidence.</h2><p>The archive preserves expectations, actual results, surprises, Nasdaq reactions, yield effects, dominant drivers and confounding events for later forecast calibration.</p></div>
      <div className="history-stats"><span><b>{verifiedResults}</b> verified outcomes</span><span><b>{eventFamilies}</b> event families</span><a href="/api/history">Download history JSON</a></div>
    </section>
    <section className="events-section">
      <div className="section-title"><div><p className="kicker">EVENT REGISTER</p><h2>What moves the Nasdaq—and why</h2></div><p>{events.length} scheduled catalysts</p></div>
      <div className="signal-key"><span><b>Impact</b> possible move size</span><span><b>Bias</b> present directional lean</span><span><b>Uncertainty</b> confidence in the baseline</span></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Event</th><th>Signals</th><th>Historical insights</th><th>Market expects</th><th>Nasdaq prefers</th><th>Main risk</th></tr></thead>
        <tbody>{eventView.map((item) => {
          const eventId = item.id;
          const result = results.get(eventId);
          const release=releaseTimestamp({eventDate:item.date,timeET:item.timeLabel.match(/(\d\d:\d\d) ET/)?.[1]??(item.type==='Earnings'?'after-close':'headline-driven')});
          const isReleased = item.date < today || (release!==null&&release<=Date.now()) || result?.status==='verified';
          const isOpen = !!openResults[eventId];
          const show = (value: string | null | undefined) => value ?? "—";
          const analysis = historicalAnalysis(item,result,archive.results as HistoricalResult[],archive.eventIndex);
          return <Fragment key={item.id}>
            <tr id={`event-${item.id}`} data-event-date={item.date}><td><time dateTime={item.date}>{prettyDate(item.date)}</time><span className="event-time">{eventTimes[eventId] ?? "Time TBD"}</span><span className={`release-state ${isReleased ? "released" : "upcoming"}`}>{isReleased ? "Released" : item.date === today ? "Today" : "Upcoming"}</span></td><td><strong>{item.event}</strong><span className={`tag tag-${item.type.toLowerCase()}`}>{item.type}</span>{"isNew" in item && item.isNew && <span className="new-badge">New</span>}{"isUpdated" in item && item.isUpdated && <span className="new-badge">Updated</span>}{item.status === "cancelled" && <span className="new-badge">Cancelled</span>}{"lastUpdated" in item && item.lastUpdated && <span className="last-updated">Last updated {item.lastUpdated}</span>}{"sourceUrl" in item && item.sourceUrl && <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">Verified source</a>}<p className="why">{item.explanation}</p><div className="playbook"><span><b>Watch live</b>{item.watch}</span><span><b>Reaction window</b>{item.window}</span></div>{isReleased && <button className="result-toggle" type="button" aria-expanded={isOpen} onClick={() => setOpenResults(current => ({ ...current, [eventId]: !current[eventId] }))}>{isOpen ? "Hide results" : "View results"}<span aria-hidden="true">{isOpen ? "−" : "+"}</span></button>}</td><td><span className={`importance ${item.importance.toLowerCase()}`}>{item.importance} impact</span><span className={`signal bias-${item.bias.toLowerCase()}`}>{item.bias} bias</span><span className={`signal uncertainty-${item.uncertainty.toLowerCase()}`}>{item.uncertainty} uncertainty</span></td><td className="historical-cell">{analysis.split("\n").map((line, lineIndex)=><p key={lineIndex}>{line}</p>)}</td><td>{item.expects}</td><td className="positive">{item.positive}</td><td className="negative">{item.negative}</td></tr>
            {isReleased && isOpen && <tr className="results-row" data-event-date={item.date}><td colSpan={7}><div className="results-panel"><div className="results-heading"><div><p className="kicker">HISTORICAL RESULT</p><h3>{item.event}</h3></div><span className={`capture-state ${result?.status === "verified" ? "verified" : "pending"}`}>{result?.status === "verified" ? "Outcome verified" : "Outcome pending"}</span></div><div className="result-metrics"><span><b>Previous</b>{show(result?.previous)}</span><span><b>Expected</b>{show(result?.expected)}</span><span><b>Actual</b>{show(result?.actual)}</span><span><b>Surprise</b>{show(result?.surprise)}</span></div><div className="index-results">{([ ["nasdaq","Nasdaq Composite"], ["sox","SOX (PHLX Semiconductor)"] ] as const).map(([key,label]) => {const levels=result?.indexLevels?.[key];const prior=levels?.priorClose?.value;const preRelease=levels?.beforeRelease?.close;return <div className="index-card" key={key}><h4>{label}</h4><div className="result-metrics"><span><b>P. Day Close</b>{level(prior)}</span><span><b>+15 minutes</b>{levelChange(levels?.at15?.close,preRelease)}</span><span><b>+1 hour</b>{levelChange(levels?.at60?.close,preRelease)}</span><span><b>Event-day close</b>{levelChange(levels?.dayClose?.value,prior)}</span></div>{levels?.releaseTimeET&&result?.indexWindows&&result.indexWindows.length>1&&<p className="index-note">Intraday values shown for {levels.releaseLabel} at {levels.releaseTimeET} ET.</p>}{levels?.intradayStatus==="plan-not-authorized"&&<p className="index-note">Massive does not authorize SOX minute bars on the current plan; intraday values are unavailable.</p>}{levels?.intradayStatus==="exact-bars-unavailable"&&<p className="index-note">No exact index minute bar at this release time, often because the event was before the 09:30 ET market open.</p>}{levels?.intradayStatus==="awaiting-minute-bars"&&<p className="index-note">No single intraday release window was recorded for this event.</p>}{levels?.intradayStatus==="no-single-release-time"&&<p className="index-note">Statements unfolded through the session; +15-minute and +1-hour event quotes are not defined.</p>}{levels?.intradayStatus==="outside-index-session"&&<p className="index-note">This release falls outside regular index trading hours. Intraday index changes are not applicable; after-close earnings use T0 close and the next trading session in the earnings archive.</p>}{result?.capture?.[key]&&<p className="index-note">{Object.entries(result.capture[key]).filter(([field])=>["priorClose","at15","at60","dayClose"].includes(field)).map(([field,state])=>`${({priorClose:"P. Day Close",at15:"+15m",at60:"+1h",dayClose:"Day close"} as Record<string,string>)[field]}: ${state?.replaceAll("-"," ")}`).join(" · ")}{result.capture[key].error?` · Source: ${result.capture[key].error}`:""}</p>}{!levels&&<p className="index-note">Index levels have not yet been captured.</p>}</div>})}</div>{result?.indexWindows&&result.indexWindows.length>1&&<div className="result-explanation"><b>Separate release windows</b>{result.indexWindows.map(window=><p key={`${window.label}-${window.releaseTimeET}`}>{window.label} ({window.releaseTimeET} ET): Nasdaq +15m {level(window.nasdaq.at15?.close)}, +1h {level(window.nasdaq.at60?.close)}; SOX +15m {level(window.sox.at15?.close)}, +1h {level(window.sox.at60?.close)}</p>)}</div>}<div className="result-explanation"><b>Why the market reacted</b><p>{result?.explanation ?? "Awaiting verified historical data."}</p>{result?.indexLevels?.nasdaq?.sourceUrl&&<a href={result.indexLevels.nasdaq.sourceUrl} target="_blank" rel="noreferrer">Index data and method</a>}{result?.sourceUrl&&<a href={result.sourceUrl} target="_blank" rel="noreferrer">Verification source</a>}</div></div></td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>
    </section>
    <footer><p>Dates shown in the U.S. market calendar. Company dates may change.</p><p>Updated 29 Sep 2026 · For planning, not investment advice.</p></footer>
  </main>;
}
