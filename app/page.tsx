"use client";

import { Fragment, useState } from "react";
import resultData from "../history/event-results.json";
import { events, eventTimes, eventView, today } from "../data/calendar";
type HistoricalResult = (typeof resultData.results)[number] & {
  qqq15m?: string | null;
  qqq1h?: string | null;
  qqqReaction?: { sourceUrl: string } | null;
  reactionWindows?: Array<{ label: string; releaseTimeET: string; assets: { QQQ: { at15: { pct: number } | null; at60: { pct: number } | null } }; priceSourceUrl: string }>;
};


const monthConfig = [
  { name: "September", month: 8, days: 30, offset: 1 },
  { name: "October", month: 9, days: 31, offset: 3 },
  { name: "November", month: 10, days: 30, offset: 6 },
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
        {day && <><span className="day-number">{day}</span>{isInteractive && <><span className="event-dot" aria-hidden="true">×</span><span className="event-short">{dayEvents.map(item => item.short).join(" + ")}</span></>}</>}
      </div>;
    })}</div>
  </article>;
}

const prettyDate = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));


export default function Home() {
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});
  const results = new Map<string, HistoricalResult>(resultData.results.map(result => [result.eventId, result]));
  const verifiedResults = resultData.results.filter(result => result.status === "verified").length;
  const eventFamilies = new Set(Object.values(resultData.eventIndex).map(item => item.eventKey)).size;
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
      <div className="date-range"><span>SEP</span><strong>→</strong><span>NOV 2026</span></div>
    </header>
    <section className="intro">
      <div><p className="kicker">FORWARD RISK MAP</p><h2>Know the days that can<br/>change the tape.</h2></div>
      <div className="intro-copy"><p>Significant macro releases, Federal Reserve decisions, Treasury auctions, AI earnings signals and the U.S. midterms—all in one decision-ready view.</p><div className="legend"><span><i className="legend-x">×</i> Significant event</span><span><i className="critical-swatch"></i> Critical risk</span></div></div>
    </section>
    <section className="calendar-section" aria-label="Three month event calendar">{monthConfig.map(month => <Calendar key={month.name} {...month} onSelect={goToEvents} />)}</section>
    <section className="history-strip" aria-label="Historical results dataset">
      <div><p className="kicker">ANALYSIS ARCHIVE</p><h2>Every result becomes reusable evidence.</h2><p>The archive preserves expectations, actual results, surprises, Nasdaq reactions, yield effects, dominant drivers and confounding events for later forecast calibration.</p></div>
      <div className="history-stats"><span><b>{verifiedResults}</b> verified outcomes</span><span><b>{eventFamilies}</b> event families</span><a href="/api/history" download>Download history JSON</a></div>
    </section>
    <section className="events-section">
      <div className="section-title"><div><p className="kicker">EVENT REGISTER</p><h2>What moves the Nasdaq—and why</h2></div><p>{events.length} scheduled catalysts</p></div>
      <div className="signal-key"><span><b>Impact</b> possible move size</span><span><b>Bias</b> present directional lean</span><span><b>Uncertainty</b> confidence in the baseline</span></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Event</th><th>Signals</th><th>Market expects</th><th>Nasdaq prefers</th><th>Main risk</th></tr></thead>
        <tbody>{eventView.map((item, index) => {
          const eventId = `${item.date}-${item.short}`;
          const result = results.get(eventId);
          const isReleased = item.date < today;
          const isOpen = !!openResults[eventId];
          const show = (value: string | null | undefined) => value ?? "—";
          return <Fragment key={`${item.date}-${index}`}>
            <tr id={`event-${item.date}-${index}`} data-event-date={item.date}><td><time dateTime={item.date}>{prettyDate(item.date)}</time><span className="event-time">{eventTimes[eventId] ?? "Time TBD"}</span><span className={`release-state ${isReleased ? "released" : "upcoming"}`}>{isReleased ? "Released" : item.date === today ? "Today" : "Upcoming"}</span></td><td><strong>{item.event}</strong><span className={`tag tag-${item.type.toLowerCase()}`}>{item.type}</span>{"isNew" in item && item.isNew && <span className="new-badge">New</span>}{"isUpdated" in item && item.isUpdated && <span className="new-badge">Updated</span>}{"lastUpdated" in item && item.lastUpdated && <span className="last-updated">Last updated {item.lastUpdated}</span>}{"sourceUrl" in item && item.sourceUrl && <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">Verified source</a>}<p className="why">{item.explanation}</p><div className="playbook"><span><b>Watch live</b>{item.watch}</span><span><b>Reaction window</b>{item.window}</span></div>{isReleased && <button className="result-toggle" type="button" aria-expanded={isOpen} onClick={() => setOpenResults(current => ({ ...current, [eventId]: !current[eventId] }))}>{isOpen ? "Hide results" : "View results"}<span aria-hidden="true">{isOpen ? "−" : "+"}</span></button>}</td><td><span className={`importance ${item.importance.toLowerCase()}`}>{item.importance} impact</span><span className={`signal bias-${item.bias.toLowerCase()}`}>{item.bias} bias</span><span className={`signal uncertainty-${item.uncertainty.toLowerCase()}`}>{item.uncertainty} uncertainty</span></td><td>{item.expects}</td><td className="positive">{item.positive}</td><td className="negative">{item.negative}</td></tr>
            {isReleased && isOpen && <tr className="results-row" data-event-date={item.date}><td colSpan={6}><div className="results-panel"><div className="results-heading"><div><p className="kicker">HISTORICAL RESULT</p><h3>{item.event}</h3></div><span className={`capture-state ${result?.status === "verified" ? "verified" : "pending"}`}>{result?.status === "verified" ? "Verified" : "Pending capture"}</span></div><div className="result-metrics"><span><b>Previous</b>{show(result?.previous)}</span><span><b>Expected</b>{show(result?.expected)}</span><span><b>Actual</b>{show(result?.actual)}</span><span><b>Surprise</b>{show(result?.surprise)}</span><span><b>QQQ +15m</b>{show(result?.qqq15m)}</span><span><b>QQQ +1h</b>{show(result?.qqq1h)}</span><span><b>Nasdaq close</b>{show(result?.nasdaqClose)}</span><span><b>10Y yield</b>{show(result?.yield10y)}</span></div>{result?.reactionWindows && result.reactionWindows.length > 1 && <div className="result-explanation"><b>Separate QQQ release windows</b>{result.reactionWindows.map(window => <p key={`${window.label}-${window.releaseTimeET}`}>{window.label} ({window.releaseTimeET} ET): +15m {window.assets.QQQ.at15 ? `${window.assets.QQQ.at15.pct > 0 ? "+" : ""}${window.assets.QQQ.at15.pct.toFixed(2)}%` : "—"}; +1h {window.assets.QQQ.at60 ? `${window.assets.QQQ.at60.pct > 0 ? "+" : ""}${window.assets.QQQ.at60.pct.toFixed(2)}%` : "—"}</p>)}</div>}<div className="result-explanation"><b>Why the market reacted</b><p>{result?.explanation ?? "Awaiting verified historical data."}</p>{result?.qqqReaction || result?.reactionWindows ? <p>QQQ minute-bar reaction from the published release time. <a href={result.qqqReaction?.sourceUrl ?? result.reactionWindows?.[0]?.priceSourceUrl} target="_blank" rel="noreferrer">Method and data source</a></p> : <p>QQQ windows await verified minute bars for the exact release time.</p>}{result?.sourceUrl && <a href={result.sourceUrl} target="_blank" rel="noreferrer">Verification source</a>}</div></div></td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>
    </section>
    <footer><p>Dates shown in the U.S. market calendar. Company dates may change.</p><p>Updated 24 Sep 2026 · For planning, not investment advice.</p></footer>
  </main>;
}
