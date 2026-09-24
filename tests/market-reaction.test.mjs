import test from "node:test";
import assert from "node:assert/strict";
import { timestamp, measure } from "../scripts/market-reaction-utils.mjs";

test("market windows use Eastern daylight time, and the exact 15th and 60th bars",()=>{
  const utc=timestamp("2026-06-10","08:30");
  assert.equal(new Date(utc).toISOString(),"2026-06-10T12:30:00.000Z");
  assert.equal(new Date(timestamp("2026-01-10","08:30")).toISOString(),"2026-01-10T13:30:00.000Z");
  const bars=new Map([[utc-60000,100],[utc+14*60000,102],[utc+59*60000,99]]);
  assert.deepEqual(measure(bars,utc,15),{pct:2,before:{minuteET:"08:29",close:100},after:{minuteET:"08:44",close:102}});
  assert.equal(measure(bars,utc,60)?.pct,-1);
  assert.equal(measure(new Map([[utc-60000,100]]),utc,15),null);
});
