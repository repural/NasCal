# NasCal

NasCal is a decision-focused Nasdaq event calendar. It combines significant macroeconomic releases, Federal Reserve meetings, Treasury auctions, technology earnings, policy events, and election risk in one calendar and event register.

Live site: https://nasdaq-event-calendar.sensups.chatgpt.site/

## What the project includes

- A three-month interactive calendar with date-to-event navigation
- Market expectations, Nasdaq-preferred outcomes, and main risks
- Event times in U.S. Eastern Time and Istanbul time when confirmed
- Verified historical outcomes and source links
- An append-only JSON archive designed for later analysis and forecast calibration
- A downloadable history file that works without a database

## Project structure

```text
app/
  page.tsx                 Calendar and results interface
  api/history/route.ts     Historical JSON download endpoint
  globals.css              Site styling
data/calendar.ts           Events, expectations and release times
history/event-results.json Persistent historical outcome dataset
history/discovery.json     Source-linked candidate queue for the preceding three completed months
history/official-schedule-snapshot-2026.json  Verified fallback for ISM's 2026 dates
tests/                     Rendering and archive checks
scripts/                   Backfill and build helpers
.openai/hosting.json       Sites deployment configuration
```

## Historical data policy

`history/event-results.json` is the analytical source of truth. New completed events should be appended after verification. Existing records should not be silently overwritten; corrections should retain an audit note and an updated verification date.

Each analytical record can capture:

- previous, expected, and actual values;
- surprise direction;
- Nasdaq reaction after 15 minutes, one hour, and at the close;
- the 10-year Treasury yield response;
- a stable recurring event family;
- the dominant market driver and relevant confounding events; and
- verification source and date.

Missing market-reaction values remain `null`. They must not be estimated or invented.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm run build
npm test
```

The dataset is stored only under `history/`. The site embeds it for the results view and serves downloads through `/api/history`; do not add a second copy under `public/`.

## Update workflow

1. Verify a scheduled event or completed result using an official source or a reputable news wire.
2. Update the event definition and/or `history/event-results.json`.
3. Preserve the stable `eventId` and `eventKey` conventions.
4. Run the build and JSON validation.
5. Review the date-click navigation and historical result panel.
6. Commit the change with a concise description of the event update.

## Three-month historical backfill

This procedure uses the three **completed calendar months** before the as-of date. For example, `--as-of=2026-09-24` covers June 1 through August 31, 2026. It does not move the site's visible three-month forward calendar into the past.

1. `node scripts/discover-history.mjs --as-of=2026-09-24` reads official BLS, BEA, Fed, Census, and ISM calendars and writes dated candidates and gaps to `history/discovery.json`. Check its `errors` and `fallbacks` fields; a missing official source is not silently interpreted as no events. Company earnings and unforeseen policy events require a separate source-checked review.
2. For each `needs-release-verification` candidate, check its original release. Record the **first published** actual and previous value, the original source URL, and an archived consensus only when independently verified. The June–August 2026 examples are in `scripts/seed-verified-history-2026.mjs`; run that script once or again safely to insert the 2026 source-checked records. Do not apply its fixed 2026 values to a later date range.
3. `MASSIVE_API_KEY=... node scripts/enrich-history-reactions.mjs --as-of=2026-09-24` obtains adjusted one-minute bars for QQQ, NVDA, and SMH and writes exact +15-minute and +60-minute results to the **same** historical file. It requires minute coverage for the event time, including extended hours for 08:30 ET releases. A missing bar stays null. Do not publish a daily close as an intraday impact. Earnings marked `after-close` await verification of the precise timestamp before measurement.
4. `node scripts/validate-history.mjs && npm test` checks uniqueness, provenance, and site behavior. Compare simultaneous releases before interpreting a reaction: the recorded price movement is a correlation around the timestamp, not proof of which announcement moved the stock.

The manually dispatched [backfill workflow](.github/workflows/backfill-three-month-history.yml) runs steps 1, 3, and 4 in **NasCal** using its `MASSIVE_API_KEY` Actions secret. It commits the updated history and discovery queue. Step 2 deliberately needs a verified release record first; the workflow cannot infer a release result or market consensus from a scheduled date. The GitHub Actions workflow updates this repository; publishing the separate Sites deployment is a distinct step.

## Forecasting roadmap

Forecasting should begin with transparent descriptive statistics rather than a complex model. Once each recurring event family has enough observations, useful measures include median Nasdaq reaction by surprise direction, hit rate, dispersion, yield sensitivity, market-regime splits, and the effect of simultaneous catalysts.

Twelve observations are not enough for dependable statistical inference. The archive should grow before model outputs are presented as forecasts.

## Disclaimer

NasCal is for market planning and research. It is not investment advice.
