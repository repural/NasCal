"use client";

import { Fragment, useEffect, useState } from "react";
import resultData from "../history/event-results.json";
import { events, eventTimes, eventView, today } from "../data/calendar";
import { earningsBenchmark, earningsHistory, earningsHistoryAsOf } from "../data/earnings-history";
type HistoricalResult = {
  eventId:string;
  status:string;
  previous?:string|null;
  expected?:string|null;
  actual?:string|null;
  surprise?:string|null;
  explanation?:string|null;
  sourceUrl?:string|null;
  reactionStatus?:string|null;
  qqq15m?: string | null;
  qqq1h?: string | null;
  qqqReaction?: { sourceUrl: string } | null;
  reactionWindows?: Array<{ label: string; releaseTimeET: string; assets?: { QQQ?: { at15?: { pct: number } | null; at60?: { pct: number } | null } }; priceSourceUrl?: string }> | null;
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

function historicalAnalysis(eventId:string,short:string,result:HistoricalResult|undefined,eventType:string,all:HistoricalResult[],index:typeof resultData.eventIndex){
  const eventDate=eventId.slice(0,10);
  if(eventType==="Earnings") {
    const earnings=earningsHistoricalAnalysis(eventDate,short.toUpperCase(),result);
    if(earnings) return earnings;
  }
  const family=index[eventId as keyof typeof index]?.eventKey??all.map(r=>r.eventId).filter(id=>id.toLowerCase().endsWith(`-${short.toLowerCase()}`)).map(id=>index[id as keyof typeof index]?.eventKey).find(Boolean);
  const peers=all.filter(r=>r.status==="verified"&&family&&index[r.eventId as keyof typeof index]?.eventKey===family&&index[r.eventId as keyof typeof index]?.eventDate<eventDate);
  const lines=[];
  if(result?.status==="verified"){
    lines.push(`Recorded outcome: ${result.actual}`);
    for(const [name,label] of [["nasdaq","Nasdaq Composite"],["sox","SOX (PHLX Semiconductor)"]]){
      const levels=result.indexLevels?.[name], before=levels?.priorClose?.value,close=levels?.dayClose?.value;
      if(before&&close)lines.push(`${label}: ${level(before)} previous close → ${level(close)} event-day close (${signed(pct(close,before))}).`);
    }
    if(result.reactionStatus==="headline-driven-no-single-release")lines.push("Several statements and other market catalysts overlapped. A single +15-minute or +1-hour effect cannot be attributed to this event.");
  }
  if(!peers.length){lines.push("No earlier verified occurrences of this event family are stored, so a comparable historical average is unavailable.");return lines.join("\n");}
  lines.push(`${peers.length} earlier verified ${family} event${peers.length===1?"":"s"} in the archive.`);
  for(const [name,label] of [["nasdaq","Nasdaq Composite"],["sox","SOX (PHLX Semiconductor)"]]){
    const observations=peers.flatMap(r=>{const p=r.indexLevels?.[name]?.priorClose?.value,c=r.indexLevels?.[name]?.dayClose?.value;return p&&c?[pct(c,p)]:[];});
    if(!observations.length){lines.push(`${label}: no comparable prior-close to day-close index observations yet.`);continue;}
    lines.push(`${label}: ${observations.filter(v=>v>0).length} of ${observations.length} sessions closed higher; median prior-close to event-day-close move ${signed(median(observations))}.`);
    for(const [field,window] of [["at15","+15 minutes"],["at60","+1 hour"]] as const){
      const moves=peers.flatMap(r=>{const levels=r.indexLevels?.[name], before=levels?.beforeRelease?.close, after=levels?.[field]?.close;return before&&after?[pct(after,before)]:[];});
      if(moves.length)lines.push(`${label} ${window}: ${moves.filter(v=>v>0).length} of ${moves.length} rose after release; median ${signed(median(moves))}.`);
    }
  }
  lines.push("These are associations across whole trading days, not isolated event effects or a forecast. Other releases and headlines may overlap.");
  return lines.join("\n");
}

const monthConfig = [
  { name: "September", month: 8, days: 30, offset: 1 },
  { name: "October", month: 9, days: 31, offset: 3 },
  { name: "November", month: 10, days: 30, offset: 6 },
  { name: "December", month: 11, days: 31, offset: 1 },
];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Calendar({ name, month, days, offset, onSelect }: (typeof monthConfig)[number] & { onSelect: (date: string) => void }) {
  const cells: (number | null)[] = Array.from({ length: offset + days }, (_, i) => i < offset ? null : i - offset + 1);
  while (cells.length % 7) cells.push(null);
  return <article className="calendar-card">
    <div className="month-heading"><h2>{name}</h2><span>2026</span></div>
    <div className="calendar-grid weekday-row">{weekdays.map(day => <div key={day}>{day}</div>)}</div>
    <div className="calendar-grid days-grid">{cells.map((day, index) => {
      const key = day ? `2026-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}` : "";
      const dayEvents = events.filter(item => item.date === key);
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
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});
  const [archive, setArchive] = useState<typeof resultData>(resultData);
  useEffect(() => {
    const cacheKey="nascal-history-v1";
    try {
      const cached=JSON.parse(localStorage.getItem(cacheKey)??"null");
      // The deployed archive is newer than a saved browser copy after a Site update.
      // Prefer it until GitHub confirms a strictly newer archive.
      const cacheIsNewer=cached?.data?.eventIndex && Array.isArray(cached.data.results)
        && cached.data.lastUpdated > resultData.lastUpdated;
      if(cacheIsNewer)setArchive(cached.data);
      if(cacheIsNewer && Date.now()-cached.fetchedAt<60*60*1000)return;
    } catch { /* Use the bundled archive when the cache cannot be read. */ }
    fetch("https://raw.githubusercontent.com/repural/NasCal/main/history/event-results.json")
      .then(response=>{if(!response.ok)throw new Error("History unavailable");return response.json();})
      .then(data=>{if(!data?.eventIndex||!Array.isArray(data.results))return;setArchive(data);try{localStorage.setItem(cacheKey,JSON.stringify({fetchedAt:Date.now(),data}));}catch{ /* Storage is optional. */ }})
      .catch(()=>{});
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
      <div className="date-range"><span>SEP</span><strong>→</strong><span>DEC 2026</span></div>
    </header>
    <section className="intro">
      <div><p className="kicker">FORWARD RISK MAP</p><h2>Know the days that can<br/>change the tape.</h2></div>
      <div className="intro-copy"><p>Significant macro releases, Federal Reserve decisions, Treasury auctions, AI earnings signals and the U.S. midterms—all in one decision-ready view.</p><div className="legend"><span><i className="legend-x">×</i> Significant event</span><span><i className="critical-swatch"></i> Critical risk</span></div></div>
    </section>
    <section className="calendar-section" aria-label="Four month event calendar">{monthConfig.map(month => <Calendar key={month.name} {...month} onSelect={goToEvents} />)}</section>
    <section className="history-strip" aria-label="Historical results dataset">
      <div><p className="kicker">ANALYSIS ARCHIVE</p><h2>Every result becomes reusable evidence.</h2><p>The archive preserves expectations, actual results, surprises, Nasdaq reactions, yield effects, dominant drivers and confounding events for later forecast calibration.</p></div>
      <div className="history-stats"><span><b>{verifiedResults}</b> verified outcomes</span><span><b>{eventFamilies}</b> event families</span><a href="https://raw.githubusercontent.com/repural/NasCal/main/history/event-results.json" target="_blank" rel="noreferrer">Download history JSON</a></div>
    </section>
    <section className="events-section">
      <div className="section-title"><div><p className="kicker">EVENT REGISTER</p><h2>What moves the Nasdaq—and why</h2></div><p>{events.length} scheduled catalysts</p></div>
      <div className="signal-key"><span><b>Impact</b> possible move size</span><span><b>Bias</b> present directional lean</span><span><b>Uncertainty</b> confidence in the baseline</span></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Event</th><th>Signals</th><th>Historical insights</th><th>Market expects</th><th>Nasdaq prefers</th><th>Main risk</th></tr></thead>
        <tbody>{eventView.map((item, index) => {
          const eventId = `${item.date}-${item.short}`;
          const result = results.get(eventId);
          const isReleased = item.date < today;
          const isOpen = !!openResults[eventId];
          const show = (value: string | null | undefined) => value ?? "—";
          const analysis = historicalAnalysis(eventId,item.short,result,item.type,archive.results as HistoricalResult[],archive.eventIndex);
          return <Fragment key={`${item.date}-${index}`}>
            <tr id={`event-${item.date}-${index}`} data-event-date={item.date}><td><time dateTime={item.date}>{prettyDate(item.date)}</time><span className="event-time">{eventTimes[eventId] ?? "Time TBD"}</span><span className={`release-state ${isReleased ? "released" : "upcoming"}`}>{isReleased ? "Released" : item.date === today ? "Today" : "Upcoming"}</span></td><td><strong>{item.event}</strong><span className={`tag tag-${item.type.toLowerCase()}`}>{item.type}</span>{"isNew" in item && item.isNew && <span className="new-badge">New</span>}{"isUpdated" in item && item.isUpdated && <span className="new-badge">Updated</span>}{"lastUpdated" in item && item.lastUpdated && <span className="last-updated">Last updated {item.lastUpdated}</span>}{"sourceUrl" in item && item.sourceUrl && <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">Verified source</a>}<p className="why">{item.explanation}</p><div className="playbook"><span><b>Watch live</b>{item.watch}</span><span><b>Reaction window</b>{item.window}</span></div>{isReleased && <button className="result-toggle" type="button" aria-expanded={isOpen} onClick={() => setOpenResults(current => ({ ...current, [eventId]: !current[eventId] }))}>{isOpen ? "Hide results" : "View results"}<span aria-hidden="true">{isOpen ? "−" : "+"}</span></button>}</td><td><span className={`importance ${item.importance.toLowerCase()}`}>{item.importance} impact</span><span className={`signal bias-${item.bias.toLowerCase()}`}>{item.bias} bias</span><span className={`signal uncertainty-${item.uncertainty.toLowerCase()}`}>{item.uncertainty} uncertainty</span></td><td className="historical-cell">{analysis.split("\n").map((line, lineIndex)=><p key={lineIndex}>{line}</p>)}</td><td>{item.expects}</td><td className="positive">{item.positive}</td><td className="negative">{item.negative}</td></tr>
            {isReleased && isOpen && <tr className="results-row" data-event-date={item.date}><td colSpan={7}><div className="results-panel"><div className="results-heading"><div><p className="kicker">HISTORICAL RESULT</p><h3>{item.event}</h3></div><span className={`capture-state ${result?.status === "verified" ? "verified" : "pending"}`}>{result?.status === "verified" ? "Verified" : "Pending capture"}</span></div><div className="result-metrics"><span><b>Previous</b>{show(result?.previous)}</span><span><b>Expected</b>{show(result?.expected)}</span><span><b>Actual</b>{show(result?.actual)}</span><span><b>Surprise</b>{show(result?.surprise)}</span></div><div className="index-results">{([ ["nasdaq","Nasdaq Composite"], ["sox","SOX (PHLX Semiconductor)"] ] as const).map(([key,label]) => {const levels=result?.indexLevels?.[key];const prior=levels?.priorClose?.value;const preRelease=levels?.beforeRelease?.close;return <div className="index-card" key={key}><h4>{label}</h4><div className="result-metrics"><span><b>P. Day Close</b>{level(prior)}</span><span><b>+15 minutes</b>{levelChange(levels?.at15?.close,preRelease)}</span><span><b>+1 hour</b>{levelChange(levels?.at60?.close,preRelease)}</span><span><b>Event-day close</b>{levelChange(levels?.dayClose?.value,prior)}</span></div>{levels?.releaseTimeET&&result?.indexWindows&&result.indexWindows.length>1&&<p className="index-note">Intraday values shown for {levels.releaseLabel} at {levels.releaseTimeET} ET.</p>}{levels?.intradayStatus==="plan-not-authorized"&&<p className="index-note">Massive does not authorize SOX minute bars on the current plan; intraday values are unavailable.</p>}{levels?.intradayStatus==="exact-bars-unavailable"&&<p className="index-note">No exact index minute bar at this release time, often because the event was before the 09:30 ET market open.</p>}{levels?.intradayStatus==="awaiting-minute-bars"&&<p className="index-note">No single intraday release window was recorded for this event.</p>}{levels?.intradayStatus==="no-single-release-time"&&<p className="index-note">Statements unfolded through the session; +15-minute and +1-hour event quotes are not defined.</p>}{!levels&&<p className="index-note">Index levels have not yet been captured.</p>}</div>})}</div>{result?.indexWindows&&result.indexWindows.length>1&&<div className="result-explanation"><b>Separate release windows</b>{result.indexWindows.map(window=><p key={`${window.label}-${window.releaseTimeET}`}>{window.label} ({window.releaseTimeET} ET): Nasdaq +15m {level(window.nasdaq.at15?.close)}, +1h {level(window.nasdaq.at60?.close)}; SOX +15m {level(window.sox.at15?.close)}, +1h {level(window.sox.at60?.close)}</p>)}</div>}<div className="result-explanation"><b>Why the market reacted</b><p>{result?.explanation ?? "Awaiting verified historical data."}</p>{result?.indexLevels?.nasdaq?.sourceUrl&&<a href={result.indexLevels.nasdaq.sourceUrl} target="_blank" rel="noreferrer">Index data and method</a>}{result?.sourceUrl&&<a href={result.sourceUrl} target="_blank" rel="noreferrer">Verification source</a>}</div></div></td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>
    </section>
    <footer><p>Dates shown in the U.S. market calendar. Company dates may change.</p><p>Updated 25 Sep 2026 · For planning, not investment advice.</p></footer>
  </main>;
}
