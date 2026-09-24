const formatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export const parts=t=>Object.fromEntries(formatter.formatToParts(new Date(t)).map(x=>[x.type,x.value]));

export function timestamp(date,time) {
  let t=Date.parse(`${date}T${time}:00Z`);
  for(let n=0;n<=7*60;n++,t+=60000) {
    const p=parts(t);
    if(`${p.year}-${p.month}-${p.day}`===date && `${p.hour}:${p.minute}`===time)return t;
  }
  throw new Error(`Invalid Eastern release time ${date} ${time}`);
}

export function measure(bars,utc,minutes){
  const before=bars.get(utc-60000),after=bars.get(utc+(minutes-1)*60000);
  if(!Number.isFinite(before)||!Number.isFinite(after)||before<=0)return null;
  const b=parts(utc-60000),a=parts(utc+(minutes-1)*60000);
  return {pct:Math.round((after/before-1)*10000)/100,
    before:{minuteET:`${b.hour}:${b.minute}`,close:before},
    after:{minuteET:`${a.hour}:${a.minute}`,close:after}};
}
