#!/usr/bin/env node
// Release dates are calendar-2025; December is fiscal Q1 2026.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const micron2025=[
  {date:'2025-03-20',period:'FY2025 Q2',fiscalYear:2025,quarter:2,periodEnd:'2025-02-27',
    revenue:8053,previousRevenue:8709,eps:1.56,previousEps:1.79,gaapEps:1.41,margin:37.9,
    revenueEstimate:7890,epsEstimate:1.42,
    guidance:{period:'FY2025 Q3',revenueMidpointUSDMillions:8800,revenueRangeUSDMillions:[8600,9000],adjustedEpsMidpoint:1.57,adjustedEpsRange:[1.47,1.67],adjustedGrossMarginPct:36.5,revenueConsensusUSDMillions:8500,adjustedEpsConsensus:null,grossMarginConsensusPct:36.9},
    sourceUrl:'https://investors.micron.com/news/press-release/2025/Micron-Technology-Inc--Reports-Results-for-the-Second-Quarter-of-Fiscal-2025-03-20-2025/default.aspx',
    consensusUrl:'https://www.reuters.com/technology/micron-forecasts-upbeat-quarterly-revenue-demand-al-memory-chips-2025-03-20/',
    grossMarginConsensusUrl:'https://www.reuters.com/technology/chipmaker-microns-shares-slump-tepid-margin-forecast-eclipses-ai-prospects-2025-03-21/',
    note:'HBM sales exceeded $1 billion; strong revenue/EPS guidance was tempered by lower sequential gross-margin guidance and weak consumer NAND pricing.'},
  {date:'2025-06-25',period:'FY2025 Q3',fiscalYear:2025,quarter:3,periodEnd:'2025-05-29',
    revenue:9301,previousRevenue:8053,eps:1.91,previousEps:1.56,gaapEps:1.68,margin:39.0,
    revenueEstimate:8870,epsEstimate:1.60,
    guidance:{period:'FY2025 Q4',revenueMidpointUSDMillions:10700,revenueRangeUSDMillions:[10400,11000],adjustedEpsMidpoint:2.50,adjustedEpsRange:[2.35,2.65],adjustedGrossMarginPct:42.0,revenueConsensusUSDMillions:9880,adjustedEpsConsensus:null,grossMarginConsensusPct:null},
    sourceUrl:'https://investors.micron.com/news/press-release/2025/Micron-Technology-Inc--Reports-Results-for-the-Third-Quarter-of-Fiscal-2025-06-25-2025/default.aspx',
    consensusUrl:'https://www.investing.com/news/stock-market-news/micron-forecasts-quarterly-revenue-above-estimates-4111286',
    note:'HBM revenue grew nearly 50% sequentially; quarterly revenue and adjusted EPS beat LSEG estimates, and the next-quarter revenue midpoint exceeded consensus.'},
  {date:'2025-09-23',period:'FY2025 Q4',fiscalYear:2025,quarter:4,periodEnd:'2025-08-28',
    revenue:11315,previousRevenue:9301,eps:3.03,previousEps:1.91,gaapEps:2.83,margin:45.7,
    revenueEstimate:11220,epsEstimate:2.86,
    guidance:{period:'FY2026 Q1',revenueMidpointUSDMillions:12500,revenueRangeUSDMillions:[12200,12800],adjustedEpsMidpoint:3.75,adjustedEpsRange:[3.60,3.90],adjustedGrossMarginPct:51.5,revenueConsensusUSDMillions:11940,adjustedEpsConsensus:null,grossMarginConsensusPct:null},
    sourceUrl:'https://investors.micron.com/news/press-release/2025/Micron-Technology-Inc--Reports-Results-for-the-Fourth-Quarter-and-Full-Year-of-Fiscal-2025-09-23-2025/default.aspx',
    consensusUrl:'https://www.tradingview.com/news/reuters.com,2025:newsml_L5N3VA1JU:0-micron-technology-inc-reports-results-for-the-quarter-ended-august-31-earnings-summary/',
    guidanceConsensusUrl:'https://www.reuters.com/technology/micron-forecasts-first-quarter-revenue-above-estimates-2025-09-23/',
    note:'Record quarterly revenue and earnings; next-quarter revenue guidance exceeded consensus, with adjusted gross margin guided above 50%.'},
  {date:'2025-12-17',period:'FY2026 Q1',fiscalYear:2026,quarter:1,periodEnd:'2025-11-27',
    revenue:13643,previousRevenue:11315,eps:4.78,previousEps:3.03,gaapEps:4.60,margin:56.8,
    revenueEstimate:12850,epsEstimate:3.95,
    guidance:{period:'FY2026 Q2',revenueMidpointUSDMillions:18700,revenueRangeUSDMillions:[18300,19100],adjustedEpsMidpoint:8.42,adjustedEpsRange:[8.22,8.62],adjustedGrossMarginPct:68.0,revenueConsensusUSDMillions:14200,adjustedEpsConsensus:4.78,grossMarginConsensusPct:null},
    sourceUrl:'https://micron.gcs-web.com/news-releases/news-release-details/micron-technology-inc-reports-results-first-quarter-fiscal-2026',
    consensusUrl:'https://www.reuters.com/business/chipmaker-micron-forecasts-quarterly-revenue-above-estimates-2025-12-17/',
    note:'AI demand and tight memory supply supported record results; revenue and adjusted EPS guidance were substantially above LSEG consensus.'}
];
const pct=(actual,expected)=>expected>0?Math.round((actual/expected-1)*10000)/100:null;
export function seedMicron2025(archive){
  for(const e of micron2025){
    const eventId=`${e.date}-MU`;
    archive.eventIndex[eventId]={...archive.eventIndex[eventId],eventDate:e.date,
      eventKey:`micron-fiscal-q${e.quarter}-earnings`,eventType:'Earnings',importance:'Critical',
      symbol:'MU',fiscalPeriod:e.period,timeET:'after-close',conferenceCallTimeET:'16:30',
      surpriseDirection:'above-consensus',nasdaqReactionDirection:'unverified',
      dominantDriver:'micron-earnings',confounders:['Other macro, trade-policy and sector developments across the 15-session window']};
    let r=archive.results.find(r=>r.eventId===eventId);
    if(!r){r={eventId};archive.results.push(r);}
    r.status='verified';r.previous=`Prior quarter: revenue $${(e.previousRevenue/1000).toFixed(3)}B; adjusted EPS $${e.previousEps.toFixed(2)}.`;
    r.expected=`Contemporaneous estimates: revenue $${(e.revenueEstimate/1000).toFixed(2)}B; adjusted EPS $${e.epsEstimate.toFixed(2)}.`;
    r.actual=`${e.period}: revenue $${(e.revenue/1000).toFixed(3)}B; adjusted EPS $${e.eps.toFixed(2)}; adjusted gross margin ${e.margin}%.`;
    r.surprise=`Revenue ${pct(e.revenue,e.revenueEstimate)}% above estimate; adjusted EPS ${pct(e.eps,e.epsEstimate)}% above estimate.`;
    r.explanation=`${e.note} T0 is the cash close BEFORE this after-close report; T+1 is the first regular-session reaction. Observed market changes are not solely attributable to earnings.`;
    r.sourceUrl=e.sourceUrl;r.verifiedAt='2026-09-30';
    r.earningsOutcome={schemaVersion:1,symbol:'MU',fiscalYear:e.fiscalYear,fiscalQuarter:e.quarter,
      fiscalPeriodEnd:e.periodEnd,releaseDate:e.date,releaseSession:'after-close',conferenceCallTimeET:'16:30',
      basis:'Revenue in USD millions; EPS in USD per diluted share. Consensus EPS is adjusted, not GAAP.',
      previous:{revenueUSDMillions:e.previousRevenue,adjustedEps:e.previousEps},
      actual:{revenueUSDMillions:e.revenue,adjustedEps:e.eps,gaapEps:e.gaapEps,adjustedGrossMarginPct:e.margin},
      consensus:{revenueUSDMillions:e.revenueEstimate,adjustedEps:e.epsEstimate,provider:'Contemporaneous Reuters/LSEG',sourceUrl:e.consensusUrl,epsSourceUrl:e.epsConsensusUrl??e.consensusUrl},
      surprisePct:{revenue:pct(e.revenue,e.revenueEstimate),adjustedEps:pct(e.eps,e.epsEstimate)},
      guidance:{...e.guidance,revenueVsConsensusPct:pct(e.guidance.revenueMidpointUSDMillions,e.guidance.revenueConsensusUSDMillions),adjustedEpsVsConsensusPct:pct(e.guidance.adjustedEpsMidpoint,e.guidance.adjustedEpsConsensus),consensusSourceUrl:e.guidanceConsensusUrl??e.consensusUrl,grossMarginConsensusSourceUrl:e.grossMarginConsensusUrl??null,epsConsensusSourceUrl:e.consensusUrl,missingConsensusReason:'Null indicates no verified contemporaneous consensus was retrieved.'},
      sourceUrl:e.sourceUrl,verifiedAt:'2026-09-30'};
  }
  archive.lastUpdated='2026-09-30';
  return archive;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const file=new URL('../history/event-results.json',import.meta.url);
  const archive=seedMicron2025(JSON.parse(await readFile(file,'utf8')));
  await writeFile(file,JSON.stringify(archive,null,2)+'\n');
  console.log('Stored four calendar-2025 Micron earnings outcomes.');
}
