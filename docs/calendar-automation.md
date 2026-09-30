# GitHub calendar refresh

The calendar's generated source of truth is `data/calendar-live.json`.
`data/calendar.ts` remains the legacy seed, not the file that scheduled refreshes edit.
Historical market observations remain in `history/event-results.json`; this refresh never rewrites them.

## Schedule and setup

The **Refresh Nasdaq calendar** Actions workflow has two schedules:

- Daily priority-event check: 07:00 Istanbul (04:00 UTC).
- Full refresh: the first day of each month at 08:00 Istanbul (05:00 UTC).

GitHub may delay scheduled jobs. Both modes also support **Run workflow**.
Pushes changing the refresh implementation run verification plus a full first refresh.

Add `OPENAI_API_KEY` in **repural/NasCal → Settings → Secrets and variables → Actions**.
It must be an OpenAI Platform API key with billing and web-search/model access.
ChatGPT subscription access is separate. Do not place keys in source or browser code.
The default model is `gpt-5.5`; optionally set the `NASCAL_RESEARCH_MODEL` Actions variable.
Hosted OpenAI web search is used directly, so a separate search-service key is unnecessary.
API calls and search use paid credits. The daily job skips the reassessment batches if
there is no verified event change; the full job reassesses every displayed event.

## Publication

The existing Site downloads the small calendar JSON on page load with a one-hour
browser cache. It does not trigger research, per-visitor AI calls, or a rebuild.
GitHub's raw-file caching can add a short propagation delay. The existing visual design,
historical results, and date navigation stay in the Site. Production code changes still
require a normal Sites deployment; GitHub does not have a permanent Sites deployment credential.

`exports/Nasdaq-Event-Calendar-2026.html` is regenerated on a meaningful refresh.
It preserves the calendar/table styling and date-click navigation. It embeds an offline
snapshot and checks the same feed when opened online. Historical insights/results link
back to the full Site; the multi-megabyte market archive is not duplicated in this export.
The export retains the legacy filename for existing links across year boundaries.
It is also downloadable as an Actions artifact. The old ChatGPT Library copy is a
separate snapshot: Actions cannot overwrite it with the current connectors. Use the
GitHub export for the automatically maintained HTML.

## Verification and audit

- Official confirmation or two independent reputable wires for every event change.
- Every cited URL must appear in the research response's retrieved sources.
- Explicit check for next U.S. Flash PMI and its 09:45 ET release.
- Separate entities for unrelated releases; stable IDs matching history.
- All three interpretation fields freshly reviewed on publication, with provenance.
- Unknown consensus explicitly marked uncertain; no manufactured forecasts.
- Cancellation keeps a labelled entry; rescheduling replaces rather than duplicates it.
- Failure, missing credentials, incomplete responses, and validation errors retain the last good calendar.
- Audits are written under `history/calendar-refresh/`; no history files under `public/`.
- Concurrent calendar refreshes queue; historical-data commits are rebased safely.

These checks establish provenance and structural validity, not infallible financial
research. Review published sources, especially unexpected political announcements.
Workflow summaries provide material-change details without creating messages/issues.

## Cutover

Keep the two existing ChatGPT calendar schedules enabled until BOTH a successful
research/publish run and the deployed Site feed integration have been verified.
Then disable **Nasdaq Priority Events** and **Refresh Nasdaq Calendar**. Do not disable
NasDecode monitoring or other unrelated tasks.
