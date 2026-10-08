import results from "../../../history/event-results.json";
import {loadHistory} from '../../../data/history-feed.mjs';

// Serve the versioned archive from history/ without maintaining a second copy in public/.
export async function GET() {
  const {archive,source}=await loadHistory(results);
  return new Response(JSON.stringify(archive, null, 2) + "\n", {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="event-results.json"',
      "cache-control": "no-store",
      "x-history-source":source,
    },
  });
}
