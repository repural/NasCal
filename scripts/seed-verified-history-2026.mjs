#!/usr/bin/env node
// One-time, source-checked release snapshots for the three completed calendar months
// before September 2026. Keep published-vintage values rather than replacing them
// with later revisions; the source URL identifies the original release.
import { readFile, writeFile } from "node:fs/promises";

const destination = new URL("../history/event-results.json", import.meta.url);
const archive = JSON.parse(await readFile(destination, "utf8"));
const verifiedAt = "2026-09-24";
const bls = (kind, date) => `https://www.bls.gov/news.release/archives/${kind}_${date}.htm`;
const bea = (name) => `https://www.bea.gov/news/2026/${name}`;
const ism = (kind, month) => `https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/${kind}/${month}/`;

// Fields: date, ID suffix, recurring family, type, ET release time, published-vintage
// previous and actual, optional *archived* consensus, primary source, explanation.
const releases = [
  ["2026-06-01", "ISM-MFG", "ism-manufacturing", "Macro", "10:00", "April Manufacturing PMI 52.7", "May Manufacturing PMI 54.0", null, "https://www.ismworld.org/globalassets/pub/research-and-surveys/rob/pmi/irun202605pmi.pdf", "The manufacturing index increased from April; the price index remained elevated."],
  ["2026-06-02", "JOLTS", "jolts", "Macro", "10:00", "March 6.9M (as revised in April release)", "April 7.6M openings", null, bls("jolts","06022026"), "Openings increased by about 731,000 in the original release."],
  ["2026-06-03", "AVGO", "broadcom-earnings", "Earnings", "after-close", "Q1 revenue $19.311B", "Q2 revenue $22.187B; AI semiconductor revenue $10.8B; Q3 revenue outlook about $29.4B", null, "https://investors.broadcom.com/news-releases/news-release-details/broadcom-inc-announces-second-quarter-fiscal-year-2026-financial", "Broadcom reported accelerating AI semiconductor demand. Earnings came after the U.S. cash close."],
  ["2026-06-03", "ISM-SVC", "ism-services", "Macro", "10:00", "April Services PMI 53.6", "May Services PMI 54.4", null, "https://www.ismworld.org/supply-management-news-and-reports/news-publications/inside-supply-management-magazine/blog/2026/2026-06/ism-pmi-reports-roundup-may-2026-services/", "Service activity expanded in the original release."],
  ["2026-06-05", "JOBS", "employment-report", "Macro", "08:30", "April payrolls +179K as stated in May release", "May payrolls +172K; unemployment 4.3%", null, bls("empsit","06052026"), "Payroll growth remained positive while unemployment held steady."],
  ["2026-06-10", "CPI", "cpi", "Inflation", "08:30", "April headline +0.6% m/m; core +0.4% m/m", "May headline +0.5% m/m; core +0.2% m/m; headline +4.2% y/y", null, bls("cpi","06102026"), "Energy contributed more than half of the monthly headline increase; core inflation was slower."],
  ["2026-06-11", "PPI", "ppi", "Inflation", "08:30", "April final demand +1.1% m/m as initially reported", "May final demand +1.1% m/m; final demand less food, energy and trade +0.8% m/m", null, bls("ppi","06112026"), "Producer inflation remained elevated, with a large gain in goods prices."],
  ["2026-06-17", "FOMC", "fomc-decision", "Fed", "14:00", "Federal funds target range 3.50%–3.75%", "Hold at 3.50%–3.75%; 12–0 vote", null, "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260617a.htm", "The FOMC held rates; the 15-minute response reflects the statement and the one-hour window overlaps the press conference."],
  ["2026-06-17", "RETAIL", "retail-sales", "Macro", "08:30", "April retail and food services sales +0.4% m/m (revised)", "May advance retail and food services sales +0.9% m/m", null, "https://www2.census.gov/retail/releases/historical/marts/adv2605.pdf", "A stronger advance retail sales reading; the afternoon FOMC decision was a separate catalyst."],
  ["2026-06-25", "PCE", "core-pce", "Inflation", "08:30", "April core PCE +0.3% m/m (June release vintage)", "May core PCE +0.3% m/m; headline +0.4% m/m", null, bea("personal-income-and-outlays-may-2026"), "Core PCE held at +0.3% month over month. First-quarter GDP third estimate was released simultaneously."],
  ["2026-06-30", "JOLTS", "jolts", "Macro", "10:00", "April 7.6M openings (revised in this release)", "May 7.6M openings", null, bls("jolts","06302026"), "Openings and hires were broadly unchanged in the original release."],
  ["2026-07-01", "ISM-MFG", "ism-manufacturing", "Macro", "10:00", "May Manufacturing PMI 54.0", "June Manufacturing PMI 53.3", null, ism("pmi","june"), "Manufacturing remained in expansion but the headline PMI cooled."],
  ["2026-07-02", "JOBS", "employment-report", "Macro", "08:30", "May payrolls +172K as stated in May release", "June payrolls +57K; unemployment 4.2%", null, bls("empsit","07022026"), "Hiring slowed sharply in the original publication; later revisions should be tracked separately."],
  ["2026-07-06", "ISM-SVC", "ism-services", "Macro", "10:00", "May Services PMI 54.5 (as listed in June release)", "June Services PMI 54.0", null, ism("services","june"), "The services headline eased while the employment component improved."],
  ["2026-07-14", "CPI", "cpi", "Inflation", "08:30", "May headline +0.5% m/m; core +0.2% m/m", "June headline -0.4% m/m; core 0.0% m/m; headline +3.5% y/y", "Headline -0.1% m/m; +3.8% y/y (Reuters poll)", bls("cpi","07142026"), "Cooling energy and a flat core reading accompanied the biggest headline monthly decline since 2020.", "https://www.reuters.com/business/view-cpi-comes-cool-soothing-markets-2026-07-14/"],
  ["2026-07-15", "PPI", "ppi", "Inflation", "08:30", "May final demand +0.6% m/m (June release vintage)", "June final demand -0.3% m/m", null, bls("ppi","07152026"), "Producer prices declined in the original release."],
  ["2026-07-16", "RETAIL", "retail-sales", "Macro", "08:30", "May retail and food services sales +1.0% m/m (revised)", "June advance retail and food services sales +0.2% m/m", null, "https://www2.census.gov/retail/releases/historical/marts/adv2606.pdf", "The small advance was within the Census Bureau's sampling uncertainty."],
  ["2026-07-29", "FOMC", "fomc-decision", "Fed", "14:00", "Federal funds target range 3.50%–3.75%", "Hold at 3.50%–3.75%; 9–3 vote (three preferred +25 bp)", null, "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm", "Three members preferred a hike; the one-hour measurement overlaps the press conference."],
  ["2026-07-30", "GDP", "gdp-advance", "Macro", "08:30", "Q1 real GDP +2.1% annualized (as stated in advance Q2 release)", "Q2 advance real GDP +1.5% annualized", null, bea("gdp-advance-estimate-2nd-quarter-2026"), "Growth decelerated. June PCE was published at the same time."],
  ["2026-07-30", "PCE", "core-pce", "Inflation", "08:30", "May core PCE +0.3% m/m (July release vintage)", "June core PCE +0.1% m/m; headline -0.1% m/m", null, bea("personal-income-and-outlays-june-2026"), "Core monthly inflation slowed. GDP was released at the same time."],
  ["2026-07-31", "ECI", "employment-cost", "Macro", "08:30", "Q1 civilian total compensation +0.9% q/q", "Q2 civilian total compensation +0.9% q/q; wages +0.9% q/q", null, bls("eci","07312026"), "Quarterly employment costs remained elevated while year-over-year growth slowed."],
  ["2026-08-04", "JOLTS", "jolts", "Macro", "10:00", "May 7.5M openings (revised in this release)", "June 7.4M openings", null, bls("jolts","08042026"), "Openings changed little while hires were stable in the original publication."],
  ["2026-08-03", "ISM-MFG", "ism-manufacturing", "Macro", "10:00", "June Manufacturing PMI 53.3", "July Manufacturing PMI 55.6", null, ism("pmi","july"), "Manufacturing activity accelerated in the original release."],
  ["2026-08-05", "ISM-SVC", "ism-services", "Macro", "10:00", "June Services PMI 54.0", "July Services PMI 54.1", null, ism("services","july"), "The services headline was nearly unchanged; employment moved into contraction."],
  ["2026-08-07", "JOBS", "employment-report", "Macro", "08:30", "June payrolls +57K as previously reported; later revised to +20K", "July payrolls -23K; unemployment 4.1%", "Payrolls +80K; unemployment 4.2% (Reuters poll)", bls("empsit","08072026"), "Payrolls unexpectedly contracted and the prior month was revised down.", "https://www.reuters.com/business/view-soft-july-jobs-report-fuels-skepticism-over-possible-fed-rate-hike-2026-08-07/"],
  ["2026-08-12", "CPI", "cpi", "Inflation", "08:30", "June headline -0.4% m/m; core 0.0% m/m", "July headline +0.1% m/m; core +0.2% m/m; headline +3.4% y/y", "Headline +3.4% y/y (Reuters poll)", bls("cpi","08122026"), "Annual headline inflation eased a little while monthly core inflation resumed.", "https://www.reuters.com/business/traders-stick-narrow-bets-september-fed-hold-after-inflation-data-2026-08-12/"],
  ["2026-08-13", "PPI", "ppi", "Inflation", "08:30", "June final demand -0.1% m/m (revised in July release)", "July final demand 0.0% m/m; final demand less food, energy and trade +0.4% m/m", null, bls("ppi","08132026"), "Flat headline producer prices masked firmer underlying services."],
  ["2026-08-14", "RETAIL", "retail-sales", "Macro", "08:30", "June retail and food services sales +0.2% m/m (unrevised)", "July advance retail and food services sales -0.6% m/m", null, "https://www2.census.gov/retail/releases/historical/marts/adv2607.pdf", "The advance estimate showed a decline in nominal sales."],
  ["2026-08-26", "GDP", "gdp-second", "Macro", "08:30", "Q2 advance real GDP +1.5% annualized", "Q2 second-estimate real GDP +1.5% annualized", null, bea("gdp-second-estimate-and-corporate-profits-2nd-quarter-2026"), "GDP was unchanged after rounding; core July PCE came at the same timestamp."],
  ["2026-08-26", "PCE", "core-pce", "Inflation", "08:30", "June core PCE +0.1% m/m (August release vintage)", "July core PCE +0.2% m/m; headline +0.2% m/m", null, bea("personal-income-and-outlays-july-2026"), "Core monthly inflation ticked higher; GDP revision was simultaneous."],
  ["2026-08-26", "NVDA", "nvidia-earnings", "Earnings", "after-close", "Q1 FY27 revenue $81.615B", "Q2 FY27 revenue $96.221B; data center $89.0B; non-GAAP EPS $2.22", null, "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2027/", "Nvidia reported after the U.S. cash close; the company scheduled its call for 17:00 ET. Do not assign an intraday 08:30 market reaction to this event."],
];

const grouped = new Map();
for (const [date, suffix, , , timeET] of releases) {
  const key = `${date}/${timeET}`;
  grouped.set(key, [...(grouped.get(key) ?? []), suffix]);
}
for (const [date, suffix, eventKey, eventType, timeET, previous, actual, expected, sourceUrl, explanation, consensusSourceUrl] of releases) {
  const eventId = `${date}-${suffix}`;
  if (archive.eventIndex[eventId] || archive.results.some(item => item.eventId === eventId)) {
    if (!archive.eventIndex[eventId] || !archive.results.some(item => item.eventId === eventId)) throw new Error(`Partial duplicate ${eventId}`);
    continue;
  }
  const companions = grouped.get(`${date}/${timeET}`).filter(other => other !== suffix);
  const confounders = companions.length ? [`Simultaneous releases: ${companions.join(", ")}; a price move cannot be attributed to either release alone.`] : [];
  if (eventKey === "fomc-decision") confounders.push("The press conference starts 30 minutes after the statement.");
  if (timeET === "after-close") confounders.push("No regular-session reaction at the release time.");
  const surprise = expected ? "See actual and archived consensus; compare matching units" : "Not assessed: pre-release consensus not yet verified";
  archive.eventIndex[eventId] = {
    eventDate: date, eventKey, eventType, importance: eventType === "Rates" ? "High" : "Critical",
    timeET, surpriseDirection: expected ? "see-consensus" : "unassessed",
    nasdaqReactionDirection: "unverified", dominantDriver: eventKey, confounders,
  };
  archive.results.push({
    eventId, status: "verified", previous, expected, actual, surprise,
    nasdaq15m: null, nasdaq1h: null, nasdaqClose: null, yield10y: null,
    qqq15m: null, qqq1h: null, reactionWindows: null,
    explanation, sourceUrl, ...(consensusSourceUrl ? { consensusSourceUrl } : {}),
    verifiedAt, reactionStatus: timeET === "after-close" ? "requires-event-timestamp" : "awaiting-minute-bars",
  });
}
archive.results.sort((a,b) => a.eventId.localeCompare(b.eventId));
archive.eventIndex = Object.fromEntries(Object.entries(archive.eventIndex).sort(([a],[b]) => a.localeCompare(b)));
archive.lastUpdated = verifiedAt;
await writeFile(destination, JSON.stringify(archive, null, 2) + "\n");
console.log(`Verified history now contains ${archive.results.length} unique releases.`);
