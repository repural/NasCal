export type CalendarEvent = {
  id:string;date:string;short:string;event:string;type:string;importance:string;
  eventKey?:string;
  explanation:string;expects:string;positive:string;negative:string;watch:string;
  window:string;bias:string;uncertainty:string;timeLabel:string;
  sourceUrl?:string;isNew?:boolean;isUpdated?:boolean;lastUpdated?:string;
  status?:string;interpretationAsOf?:string;
  sources?:Array<{url:string;title:string}>;
  interpretationSources?:Array<{url:string;title:string}>;
};
export type CalendarFeed={schemaVersion:number;updatedAt:string;asOf:string;horizonEnd:string;events:CalendarEvent[];recentEvents?:CalendarEvent[]};
export function validFeed(value:unknown):value is CalendarFeed {
  if(!value||typeof value!=="object")return false;
  const data=value as CalendarFeed;
  if(data.schemaVersion!==1||typeof data.updatedAt!=="string"||!Number.isFinite(Date.parse(data.updatedAt))||!Array.isArray(data.events)||!data.events.length)return false;
  if(data.recentEvents!==undefined&&!Array.isArray(data.recentEvents))return false;
  return [data.events,data.recentEvents??[]].every(list=>{
  const ids=new Set<string>();
  return list.every(e=>{
    if(!e||typeof e!=="object")return false;
    if(![e.id,e.date,e.short,e.event,e.type,e.importance,e.explanation,e.expects,e.positive,e.negative,e.watch,e.window,e.bias,e.uncertainty,e.timeLabel].every(v=>typeof v==="string"&&v.length>0))return false;
    if(e.id!==`${e.date}-${e.short}`||ids.has(e.id)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))return false;
    ids.add(e.id);
    return !e.sourceUrl||e.sourceUrl.startsWith("https://");
  });});
}
export { dashboardMonths as calendarMonths } from './calendar-window.mjs';
