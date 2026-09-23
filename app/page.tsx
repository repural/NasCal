"use client";

import { Fragment, useState } from "react";
import resultData from "../public/event-results.json";

const events = [
  { date: "2026-09-01", short: "ISM + JOLTS", event: "ISM Manufacturing PMI + JOLTS", type: "Macro", importance: "High", explanation: "Factory activity, prices paid and job openings reshape expectations for growth, wages and Fed policy.", positive: "Moderate growth and cooler prices/openings", negative: "Hot prices or unusually strong labor demand" },
  { date: "2026-09-02", short: "AVGO", event: "Broadcom earnings", type: "Earnings", importance: "High", explanation: "A direct read on custom AI accelerators, networking demand and hyperscaler capital spending.", positive: "Strong AI orders and guidance", negative: "Weak order timing or cautious guidance" },
  { date: "2026-09-03", short: "ISM Services", event: "ISM Services PMI", type: "Macro", importance: "High", explanation: "Services prices are central to the Fed’s inflation assessment and can move Treasury yields quickly.", positive: "Cooling prices with continued expansion", negative: "Sticky prices-paid reading" },
  { date: "2026-09-04", short: "Jobs", event: "August employment report", type: "Macro", importance: "Critical", explanation: "Payrolls, unemployment, wages and revisions determine whether the labor market is cooling in an orderly way.", positive: "Slower wages and moderate hiring", negative: "Overheating or recession-level weakness" },
  { date: "2026-09-08", short: "3Y", event: "3-year Treasury auction", type: "Rates", importance: "High", explanation: "Auction demand influences short-term yields and the market’s required return for growth stocks.", positive: "Strong demand and stable yields", negative: "Weak bid-to-cover and rising yields" },
  { date: "2026-09-09", short: "10Y", event: "10-year Treasury auction", type: "Rates", importance: "High", explanation: "The 10-year yield is a key discount rate for long-duration technology earnings.", positive: "Strong demand lowers yields", negative: "Auction tail pushes yields higher" },
  { date: "2026-09-10", short: "PPI + 30Y", event: "August PPI + 30-year auction", type: "Inflation", importance: "High", explanation: "Pipeline inflation and long-bond demand arrive together, creating a concentrated rates risk.", positive: "Soft PPI and strong auction", negative: "Hot PPI and weak auction" },
  { date: "2026-09-11", short: "CPI", event: "August CPI", type: "Inflation", importance: "Critical", explanation: "The last major consumer-inflation report before the September Fed decision.", positive: "Core and services CPI at or below forecast", negative: "Broad upside inflation surprise" },
  { date: "2026-09-15", short: "FOMC 1", event: "FOMC meeting — day 1", type: "Fed", importance: "Critical", explanation: "Policy deliberations begin with markets positioned for a possible rate increase.", positive: "Stable yields into the decision", negative: "Late jump in hike expectations" },
  { date: "2026-09-16", short: "FED + Retail", event: "Fed decision, projections and retail sales", type: "Fed", importance: "Critical", explanation: "The rate decision, dot plot and Warsh press conference coincide with a major consumer-demand report.", positive: "Hold or restrained path; moderate sales", negative: "Hike plus further tightening signal" },
  { date: "2026-09-18", short: "Witching", event: "Triple-witching expiration", type: "Market", importance: "High", explanation: "Equity options, index options and futures expire, often increasing mechanical volume and volatility.", positive: "Orderly positioning and broad participation", negative: "Disorderly de-risking into the close" },
  { date: "2026-09-22", short: "2Y", event: "2-year Treasury auction", type: "Rates", importance: "High", explanation: "Tests demand for the maturity most closely linked to the expected Fed path.", positive: "Strong demand", negative: "Yield spike after weak demand" },
  { date: "2026-09-23", short: "5Y", event: "5-year Treasury auction", type: "Rates", importance: "High", explanation: "A mid-curve demand check immediately after the Fed meeting.", positive: "Contained yields", negative: "Weak auction broadens rate pressure" },
  { date: "2026-09-24", short: "7Y", event: "7-year Treasury auction", type: "Rates", importance: "High", explanation: "Often a sensitive auction for duration demand and technology valuations.", positive: "Good bid-to-cover", negative: "Large auction tail" },
  { date: "2026-09-24", short: "TRUMP–XI", event: "Trump–Xi summit during Xi U.S. state visit", type: "Politics", importance: "Critical", explanation: "The leaders are expected to discuss trade, tariffs, AI-chip export controls, rare-earth supplies and broader U.S.–China relations during Xi’s September 23–25 state visit.", positive: "Trade-truce extension, tariff restraint or reduced technology tension", negative: "New tariffs, export restrictions or deterioration in relations", isNew: true, sourceUrl: "https://www.reuters.com/world/china/chinas-xi-visit-us-september-23-25-2026-09-21/" },
  { date: "2026-09-30", short: "PCE + GDP + MU", event: "Core PCE, final Q2 GDP and Micron earnings", type: "Mixed", importance: "Critical", explanation: "The Fed’s preferred inflation gauge, revised growth data and an AI-memory bellwether arrive together.", positive: "Cooling PCE and strong HBM outlook", negative: "Hot PCE or weak memory guidance" },
  { date: "2026-10-01", short: "ISM", event: "ISM Manufacturing PMI", type: "Macro", importance: "High", explanation: "A fresh reading on growth, orders and prices after the September Fed decision.", positive: "Balanced growth and cooler prices", negative: "Reacceleration in prices" },
  { date: "2026-10-02", short: "Jobs", event: "September employment report", type: "Macro", importance: "Critical", explanation: "A second labor report establishes whether September’s trend was durable or temporary.", positive: "Orderly cooling", negative: "Strong wage reacceleration" },
  { date: "2026-10-05", short: "ISM Services", event: "ISM Services PMI", type: "Macro", importance: "High", explanation: "Services activity and prices help set expectations for the October Fed meeting.", positive: "Lower prices-paid", negative: "Persistent service inflation" },
  { date: "2026-10-08", short: "TSMC", event: "TSMC monthly sales update", type: "Earnings", importance: "High", explanation: "An early demand signal for advanced-node chips and the broader AI semiconductor chain.", positive: "Accelerating advanced-node sales", negative: "Demand slowdown" },
  { date: "2026-10-14", short: "CPI", event: "September CPI", type: "Inflation", importance: "Critical", explanation: "The decisive consumer-inflation report before the October Fed meeting.", positive: "Continued disinflation", negative: "Second consecutive hot CPI" },
  { date: "2026-10-15", short: "PPI + Retail", event: "September PPI and retail sales", type: "Inflation", importance: "Critical", explanation: "Combines pipeline inflation with consumer strength, clarifying the growth-inflation balance.", positive: "Soft prices and moderate real demand", negative: "Hot prices with strong nominal sales" },
  { date: "2026-10-27", short: "FOMC 1", event: "FOMC meeting — day 1", type: "Fed", importance: "Critical", explanation: "The Fed begins deliberations with two new jobs and CPI reports since Jackson Hole.", positive: "Stable policy expectations", negative: "Markets price another hike" },
  { date: "2026-10-28", short: "FED", event: "Fed rate decision", type: "Fed", importance: "Critical", explanation: "Statement language and Warsh’s press conference determine the expected December path.", positive: "Hold with cooler-inflation acknowledgement", negative: "Hike or hawkish December guidance" },
  { date: "2026-10-29", short: "GDP + PCE", event: "Q3 advance GDP + September core PCE", type: "Mixed", importance: "Critical", explanation: "Growth and the Fed’s preferred inflation measure are released together the morning after the Fed.", positive: "Healthy growth with cooler PCE", negative: "Hot PCE or stagflationary mix" },
  { date: "2026-11-03", short: "MIDTERMS", event: "U.S. midterm elections", type: "Politics", importance: "Critical", explanation: "Control of Congress affects expectations for taxes, tariffs, deficits, AI regulation and antitrust policy.", positive: "Clear result and limited policy surprise", negative: "Contested result or yield-raising fiscal surprise" },
];

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

const playbooks: Record<string, { expects: string; watch: string; window: string; bias: string; uncertainty: string }> = {
  Macro: { expects: "A gradual slowdown without a sharp contraction.", watch: "Headline, prices paid, employment and revisions", window: "Release through the first 90 minutes", bias: "Neutral", uncertainty: "Medium" },
  Earnings: { expects: "Results near consensus; guidance and AI demand matter more than the headline.", watch: "Guidance, AI revenue, margins and capex commentary", window: "After-hours move and next regular session", bias: "Neutral", uncertainty: "High" },
  Rates: { expects: "Orderly demand without a material auction tail.", watch: "High yield, tail, bid-to-cover and indirect bidders", window: "Auction release through the cash close", bias: "Neutral", uncertainty: "Medium" },
  Inflation: { expects: "Inflation continues easing only gradually.", watch: "Core monthly rate, services, shelter and revisions", window: "08:30 ET release; confirm after yields settle", bias: "Neutral", uncertainty: "High" },
  Fed: { expects: "Policy follows the latest guidance; language drives the next move.", watch: "Decision, statement changes, projections and press conference", window: "14:00–15:30 ET", bias: "Neutral", uncertainty: "High" },
  Market: { expects: "Higher volume and mechanical volatility, not a fundamental catalyst.", watch: "Index breadth, closing imbalance and dealer positioning", window: "Final two trading hours", bias: "Neutral", uncertainty: "Medium" },
  Politics: { expects: "No reliable consensus; headlines can change the baseline quickly.", watch: "Official statements, tariffs, export controls and implementation dates", window: "Headline-driven; may extend across sessions", bias: "Neutral", uncertainty: "High" },
  Mixed: { expects: "Cross-currents; rates and the highest-surprise release should dominate.", watch: "Inflation surprise, growth mix, guidance and Treasury yields", window: "Release through the following close", bias: "Neutral", uncertainty: "High" },
};

const eventView = events.map(item => ({ ...item, ...playbooks[item.type] }));
const today = "2026-09-23";
const eventTimes: Record<string, string> = {
  "2026-09-01-ISM + JOLTS": "10:00 ET · 17:00 Istanbul",
  "2026-09-02-AVGO": "After U.S. close · about 23:00 Istanbul",
  "2026-09-03-ISM Services": "10:00 ET · 17:00 Istanbul",
  "2026-09-04-Jobs": "08:30 ET · 15:30 Istanbul",
  "2026-09-08-3Y": "13:00 ET · 20:00 Istanbul",
  "2026-09-09-10Y": "13:00 ET · 20:00 Istanbul",
  "2026-09-10-PPI + 30Y": "PPI 08:30 ET / 15:30 Istanbul · Auction 13:00 ET / 20:00",
  "2026-09-11-CPI": "08:30 ET · 15:30 Istanbul",
  "2026-09-15-FOMC 1": "Closed meeting · no public release",
  "2026-09-16-FED + Retail": "Retail 08:30 ET / 15:30 · Fed 14:00 ET / 21:00 · Press 14:30 ET / 21:30",
  "2026-09-18-Witching": "Expiration into 16:00 ET close · 23:00 Istanbul",
  "2026-09-22-2Y": "13:00 ET · 20:00 Istanbul",
  "2026-09-23-5Y": "13:00 ET · 20:00 Istanbul",
  "2026-09-24-7Y": "13:00 ET · 20:00 Istanbul",
  "2026-09-24-TRUMP–XI": "Time TBD",
  "2026-09-30-PCE + GDP + MU": "Data 08:30 ET / 15:30 Istanbul · MU after U.S. close (about 23:00)",
  "2026-10-01-ISM": "10:00 ET · 17:00 Istanbul",
  "2026-10-02-Jobs": "08:30 ET · 15:30 Istanbul",
  "2026-10-05-ISM Services": "10:00 ET · 17:00 Istanbul",
  "2026-10-08-TSMC": "Publication time not fixed",
  "2026-10-14-CPI": "08:30 ET · 15:30 Istanbul",
  "2026-10-15-PPI + Retail": "08:30 ET · 15:30 Istanbul",
  "2026-10-27-FOMC 1": "Closed meeting · no public release",
  "2026-10-28-FED": "Decision 14:00 ET / 21:00 Istanbul · Press 14:30 ET / 21:30",
  "2026-10-29-GDP + PCE": "08:30 ET · 15:30 Istanbul",
  "2026-11-03-MIDTERMS": "Polling hours vary · results mainly after 19:00 ET / 03:00 Istanbul (Nov 4)",
};

export default function Home() {
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});
  const results = new Map(resultData.results.map(result => [result.eventId, result]));
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
      <div className="history-stats"><span><b>{verifiedResults}</b> verified outcomes</span><span><b>{eventFamilies}</b> event families</span><a href="/event-results.json" download>Download history JSON</a></div>
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
            <tr id={`event-${item.date}-${index}`} data-event-date={item.date}><td><time dateTime={item.date}>{prettyDate(item.date)}</time><span className="event-time">{eventTimes[eventId] ?? "Time TBD"}</span><span className={`release-state ${isReleased ? "released" : "upcoming"}`}>{isReleased ? "Released" : item.date === today ? "Today" : "Upcoming"}</span></td><td><strong>{item.event}</strong><span className={`tag tag-${item.type.toLowerCase()}`}>{item.type}</span>{"isNew" in item && item.isNew && <span className="new-badge">New</span>}{"sourceUrl" in item && item.sourceUrl && <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">Verified source</a>}<p className="why">{item.explanation}</p><div className="playbook"><span><b>Watch live</b>{item.watch}</span><span><b>Reaction window</b>{item.window}</span></div>{isReleased && <button className="result-toggle" type="button" aria-expanded={isOpen} onClick={() => setOpenResults(current => ({ ...current, [eventId]: !current[eventId] }))}>{isOpen ? "Hide results" : "View results"}<span aria-hidden="true">{isOpen ? "−" : "+"}</span></button>}</td><td><span className={`importance ${item.importance.toLowerCase()}`}>{item.importance} impact</span><span className={`signal bias-${item.bias.toLowerCase()}`}>{item.bias} bias</span><span className={`signal uncertainty-${item.uncertainty.toLowerCase()}`}>{item.uncertainty} uncertainty</span></td><td>{item.expects}</td><td className="positive">{item.positive}</td><td className="negative">{item.negative}</td></tr>
            {isReleased && isOpen && <tr className="results-row" data-event-date={item.date}><td colSpan={6}><div className="results-panel"><div className="results-heading"><div><p className="kicker">HISTORICAL RESULT</p><h3>{item.event}</h3></div><span className={`capture-state ${result?.status === "verified" ? "verified" : "pending"}`}>{result?.status === "verified" ? "Verified" : "Pending capture"}</span></div><div className="result-metrics"><span><b>Previous</b>{show(result?.previous)}</span><span><b>Expected</b>{show(result?.expected)}</span><span><b>Actual</b>{show(result?.actual)}</span><span><b>Surprise</b>{show(result?.surprise)}</span><span><b>Nasdaq +15m</b>{show(result?.nasdaq15m)}</span><span><b>Nasdaq +1h</b>{show(result?.nasdaq1h)}</span><span><b>Nasdaq close</b>{show(result?.nasdaqClose)}</span><span><b>10Y yield</b>{show(result?.yield10y)}</span></div><div className="result-explanation"><b>Why the market reacted</b><p>{result?.explanation ?? "Awaiting verified historical data."}</p>{result?.sourceUrl && <a href={result.sourceUrl} target="_blank" rel="noreferrer">Verification source</a>}</div></div></td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>
    </section>
    <footer><p>Dates shown in the U.S. market calendar. Company dates may change.</p><p>Updated 23 Sep 2026 · For planning, not investment advice.</p></footer>
  </main>;
}
