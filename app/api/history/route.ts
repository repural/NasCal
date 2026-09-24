import results from "../../../history/event-results.json";

// Serve the versioned archive from history/ without maintaining a second copy in public/.
export function GET() {
  return new Response(JSON.stringify(results, null, 2) + "\n", {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="event-results.json"',
      "cache-control": "public, max-age=300",
    },
  });
}
