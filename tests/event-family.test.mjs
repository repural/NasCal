import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canonicalFamily,resolveEventFamily,historicalPeers} from '../data/event-family.mjs';

test('October ISM finds the nine stored manufacturing outcomes despite label variants', () => {
  const archive=JSON.parse(fs.readFileSync(new URL('../history/event-results.json',import.meta.url)));
  const event={date:'2026-10-01',short:'ISM',event:'ISM Manufacturing PMI'};
  const {family,peers}=historicalPeers(event,archive.results,archive.eventIndex);
  assert.equal(family,'ism-manufacturing');
  assert.deepEqual(peers.map(r=>r.eventId.slice(0,10)).sort(),['2026-01-05','2026-02-02','2026-03-02','2026-04-01','2026-05-01','2026-06-01','2026-07-01','2026-08-03','2026-09-01']);
});
test('manufacturing, services, Flash, decision/minutes and GDP vintages stay separate', () => {
  assert.equal(resolveEventFamily({short:'ISM',event:'ISM Services PMI'}),'ism-services');
  assert.equal(resolveEventFamily({short:'ISM',event:'ISM Non-Manufacturing PMI'}),'ism-services');
  assert.equal(canonicalFamily('ISM Mfg'),'ism-manufacturing');
  assert.equal(canonicalFamily('sp-global-us-flash-pmi'),'flash-pmi');
  assert.equal(resolveEventFamily({short:'FED',event:'FOMC minutes'}),'fomc-minutes');
  assert.equal(resolveEventFamily({short:'GDP',event:'Q3 GDP second estimate'}),'gdp-second');
  assert.equal(resolveEventFamily({short:'GDP',event:'GDP report'}),null);
  assert.equal(canonicalFamily('seven-year-treasury-auction'),'treasury-7y-auction');
});
test('explicit keys survive renaming and unknown events never use fuzzy matches', () => {
  assert.equal(resolveEventFamily({eventKey:'ism-manufacturing',short:'NEW LABEL',event:'Renamed report'}),'ism-manufacturing');
  assert.equal(resolveEventFamily({eventKey:'new-policy-event',short:'ISM'}),'new-policy-event');
  assert.equal(resolveEventFamily({event:'Unrelated manufacturing company news'}),null);
  const index={a:{eventDate:'2026-09-01',eventKey:'ism-manufacturing'},b:{eventDate:'2026-10-01',eventKey:'ism-manufacturing'},c:{eventDate:'2026-08-01',eventKey:'ism-services'},d:{eventDate:'2026-07-01',eventKey:'ism-manufacturing'}};
  const results=['a','b','c','d'].map(eventId=>({eventId,status:eventId==='d'?'pending':'verified'}));
  assert.deepEqual(historicalPeers({date:'2026-10-01',eventKey:'ism-manufacturing'},results,index).peers.map(r=>r.eventId),['a']);
});
