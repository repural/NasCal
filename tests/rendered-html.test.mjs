import assert from "node:assert/strict";
import test from "node:test";

test("renders the calendar and serves the historical archive from history/", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /Nasdaq event calendar/);
  assert.match(html, /href="\/api\/history"/);

  const history = await worker.fetch(
    new Request("http://localhost/api/history"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(history.status, 200);
  assert.match(history.headers.get("content-disposition") ?? "", /event-results\.json/);
  assert.ok((await history.json()).results.length > 0);
});
