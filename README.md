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

## Forecasting roadmap

Forecasting should begin with transparent descriptive statistics rather than a complex model. Once each recurring event family has enough observations, useful measures include median Nasdaq reaction by surprise direction, hit rate, dispersion, yield sensitivity, market-regime splits, and the effect of simultaneous catalysts.

Twelve observations are not enough for dependable statistical inference. The archive should grow before model outputs are presented as forecasts.

## Disclaimer

NasCal is for market planning and research. It is not investment advice.
