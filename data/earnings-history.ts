// Compatibility adapter: the only persisted earnings dataset is history/event-results.json.
import archive from "../history/event-results.json";

type Summary = {
  date:string; session:"after_close"|"before_open";
  leadStock:number; leadBenchmark:number;
  firstStock:number; firstBenchmark:number;
  followStock:number; followBenchmark:number;
  totalStock:number; totalBenchmark:number;
};

export const earningsHistoryAsOf=archive.earnings.asOf;
export const earningsHistory=archive.earnings.summaries as Record<string, Summary[]>;
export const earningsBenchmark=archive.earnings.benchmark as Record<string, string>;
