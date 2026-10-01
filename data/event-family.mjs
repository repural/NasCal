// Canonical keys describe comparable releases, never display labels or dates.
const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const groups = {
  'ism-manufacturing': ['ism', 'ism-mfg', 'ism-manufacturing-pmi'],
  'ism-services': ['ism-svc', 'ism-services-pmi'],
  'flash-pmi': ['sp-global-us-flash-pmi', 's-p-global-us-flash-pmi'],
  'employment-report': ['jobs', 'nfp', 'payrolls'],
  'cpi': [], 'ppi': [], 'jolts': [],
  'core-pce': ['pce'], 'retail-sales': ['retail'],
  'employment-cost': ['eci'], 'productivity-costs': ['productivity'],
  'gdp-advance': [], 'gdp-second': [], 'gdp-final': ['gdp-updated'],
  'fomc-decision': ['fed'], 'fomc-minutes': [], 'fomc-day-1': ['fomc-1'],
  'treasury-2y-auction': ['2y', 'two-year-treasury-auction'],
  'treasury-3y-auction': ['3y', 'three-year-treasury-auction'],
  'treasury-5y-auction': ['5y', 'five-year-treasury-auction'],
  'treasury-7y-auction': ['7y', 'seven-year-treasury-auction'],
  'treasury-10y-auction': ['10y', 'ten-year-treasury-auction'],
  'treasury-30y-auction': ['30y', 'thirty-year-treasury-auction'],
  'triple-witching': [], 'monthly-options-expiry': [],
  'tsmc-monthly-sales': [], 'us-midterm-elections': ['midterms'],
  'apec-leaders': ['apec'], 'g20-leaders': ['g20'], 'trump-xi-summit': [],
};
const aliases = new Map(Object.entries(groups).flatMap(([key, values]) => [key, ...values].map(value => [value, key])));

export function canonicalFamily(value) {
  const key = normalize(value);
  // Preserve explicit issuer/quarter keys; earnings analysis has its own issuer grouping.
  return aliases.get(key) ?? (key.endsWith('-earnings') ? key : null);
}

/** @param {{eventKey?:string,event?:string,title?:string,short?:string}} event */
export function resolveEventFamily(event = {}) {
  // An explicit stored key always wins. Unknown explicit keys stay isolated.
  if (event.eventKey) return canonicalFamily(event.eventKey) ?? normalize(event.eventKey);
  const title = String(event.event ?? event.title ?? '');
  // Specific titles take precedence over ambiguous legacy abbreviations.
  if (/\bISM\b/i.test(title) && /services|non.manufactur/i.test(title)) return 'ism-services';
  if (/\bISM\b/i.test(title) && /manufactur/i.test(title)) return 'ism-manufacturing';
  if (/flash/i.test(title) && /PMI/i.test(title) && /S&P|S.P Global/i.test(title)) return 'flash-pmi';
  if (/GDP|gross domestic product/i.test(title)) {
    if (/advance/i.test(title)) return 'gdp-advance';
    if (/second/i.test(title)) return 'gdp-second';
    if (/final|third/i.test(title)) return 'gdp-final';
    return null; // Do not blend GDP estimates when the vintage is unknown.
  }
  if (/minutes/i.test(title) && /Fed|FOMC/i.test(title)) return 'fomc-minutes';
  if (/FOMC/i.test(title) && /day\s*1/i.test(title)) return 'fomc-day-1';
  if (/TSMC|Taiwan Semiconductor/i.test(title) && /monthly.*sales/i.test(title)) return 'tsmc-monthly-sales';
  return canonicalFamily(event.short);
}

/**
 * @template {{eventId:string,status:string}} T
 * @param {{date:string,eventKey?:string,event?:string,short?:string}} event
 * @param {T[]} results
 * @param {Record<string,{eventDate:string,eventKey?:string}>} index
 */
export function historicalPeers(event, results, index) {
  const family = resolveEventFamily(event);
  const peers = family ? results.filter(result => {
    const entry = index[result.eventId];
    return result.status === 'verified' && entry?.eventDate < event.date && resolveEventFamily(entry) === family;
  }) : [];
  return { family, peers };
}
