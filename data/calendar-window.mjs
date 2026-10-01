// Keep the four forward months; add the prior month through day 7, inclusive.
export function dashboardMonths(date) {
  const d=new Date(date+'T12:00:00Z');
  const previous=d.getUTCDate()<=7;
  return Array.from({length:previous?5:4},(_,i)=>{
    const first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+i-(previous?1:0),1));
    return {name:first.toLocaleString('en-US',{month:'long',timeZone:'UTC'}),year:first.getUTCFullYear(),month:first.getUTCMonth(),days:new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate(),offset:(first.getUTCDay()+6)%7};
  });
}

/** @template {{id:string,date:string}} T @param {{events:T[],recentEvents?:T[]}} data @param {string} date @returns {T[]} */
export function visibleCalendarEvents(data,date) {
  const months=dashboardMonths(date),first=months[0],last=months.at(-1);
  const start=new Date(Date.UTC(first.year,first.month,1)).toISOString().slice(0,10);
  const end=new Date(Date.UTC(last.year,last.month+1,0)).toISOString().slice(0,10);
  // Current entries override stored snapshots with the same stable identity.
  return [...new Map([...(data.recentEvents??[]),...data.events].map(e=>[e.id,e])).values()]
    .filter(e=>e.date>=start&&e.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
