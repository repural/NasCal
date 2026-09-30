# API-free calendar collection and ChatGPT review

`Refresh Nasdaq calendar` runs daily at 07:00 Istanbul and monthly on the first at
08:00 Istanbul, with manual dispatch and implementation-push triggers. No OpenAI key,
model or paid AI/search API is used. Standard Actions runner execution is free for public
repos; storage allowances still apply. Existing Massive enrichment workflows and their
credentials are unchanged. This migration does not change market-data plan costs.

## GitHub responsibilities

The collector downloads BLS and BEA iCalendar feeds, checks upcoming entries over 90 days,
and monitors the Fed announcement RSS feed. It attempts the S&P Global release calendar;
access blocks or an unreadable schedule are explicit review flags, never inferred dates.
UTC and Eastern release times are parsed with DST. Major CPI/PPI/jobs/JOLTS/ECI/productivity,
PCE and GDP observations are compared with the published calendar. Stable source UIDs
identify observed reschedules; missing source entries never imply cancellation.

Results go to `history/calendar-refresh/official-review.json`, including source health,
observations, missing/rescheduled/time-changed/cancelled proposals, and recent Fed policy
headlines. These are research inputs, not confirmed market-moving news. A stale feed does
not establish forward coverage. Failed feeds are recorded. If all feeds fail or are stale,
the job fails after saving its report. No historical prices or outcomes are overwritten.

## ChatGPT responsibilities — retain both existing tasks

Keep **Nasdaq Priority Events** and **Refresh Nasdaq Calendar** enabled. Read the latest
GitHub review report first, then research its flags and other unexpected geopolitical,
trade-policy and company developments from official sources and reputable wires.
Explicitly verify the next Flash US PMI date at 09:45 ET even if source access failed.
Before publishing any calendar changes, reassess EVERY displayed event's three distinct
fields: Market expects, Nasdaq prefers and Main risk, using current sourced information.
An automated collection timestamp is never an interpretation verification timestamp.

The collector intentionally stages proposals rather than publishing unchecked changes
with stale market interpretation. ChatGPT completes verification, updates
`data/calendar-live.json`, regenerates `exports/Nasdaq-Event-Calendar-2026.html`, and
updates/publishes the existing Site and any separately requested HTML snapshot as needed.
Do not disable the ChatGPT tasks as part of this hybrid approach. They use existing plan
allowances; GitHub cannot invoke a ChatGPT subscription as an API.

## Publication and storage

The Site already loads the shared `data/calendar-live.json` with a one-hour browser cache
and bundled fallback. Visitors never launch collection or AI research. Data updates need
no Site code deployment; design changes still require Sites deployment. The standalone
HTML has the same feed and offline snapshot. Its historical-results links open the Site.
GitHub export and any separately saved HTML copy are distinct artifacts.

All collection data remains under `history/`, not `public/`. Concurrent refreshes queue;
publication rebases onto main without force-pushing. The existing calendar remains
unchanged until researched review is complete. No extra notifications/issues are created
for routine collection runs.
