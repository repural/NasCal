export async function loadHistory(fallback,request=fetch){
  try{
    const response=await request('https://raw.githubusercontent.com/repural/NasCal/main/history/event-results.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(`History HTTP ${response.status}`);
    const current=await response.json();
    if(!current?.eventIndex||!Array.isArray(current.results))throw Error('Invalid history');
    if((current.updatedAt??current.lastUpdated??'')<(fallback.updatedAt??fallback.lastUpdated??''))throw Error('Older history');
    return {archive:current,source:'github-main'};
  }catch{return {archive:fallback,source:'bundled-fallback'};}
}
