// Compact price-response summaries derived from the owner's NasBoard earnings archives.
// No underlying close-price history or account data are distributed with this site.
// Regenerate from the private archives after new earnings are verified.
export const earningsHistoryAsOf = "2026-09-25";
export const earningsHistory: Record<string, Array<{
  date: string; session: string;
  preStock: number; preBenchmark: number;
  post1Stock: number; post1Benchmark: number;
  post7Stock: number; post7Benchmark: number;
}>> = {
  "NVDA": [
    {
      "date": "2026-02-25",
      "session": "after_close",
      "preStock": 3.16,
      "preBenchmark": 3.06,
      "post1Stock": -5.46,
      "post1Benchmark": -3.19,
      "post7Stock": -9.07,
      "post7Benchmark": -11.25
    },
    {
      "date": "2026-05-20",
      "session": "after_close",
      "preStock": 2.51,
      "preBenchmark": -3.99,
      "post1Stock": -1.77,
      "post1Benchmark": 1.28,
      "post7Stock": 0.4,
      "post7Benchmark": 9.75
    },
    {
      "date": "2026-08-26",
      "session": "after_close",
      "preStock": -5.38,
      "preBenchmark": -6.68,
      "post1Stock": 8.74,
      "post1Benchmark": 2.33,
      "post7Stock": 9.87,
      "post7Benchmark": 1.07
    }
  ],
  "AMD": [
    {
      "date": "2026-02-03",
      "session": "after_close",
      "preStock": -2.94,
      "preBenchmark": 0.98,
      "post1Stock": -17.31,
      "post1Benchmark": -4.36,
      "post7Stock": -14.94,
      "post7Benchmark": 1.49
    },
    {
      "date": "2026-05-05",
      "session": "after_close",
      "preStock": 11.86,
      "preBenchmark": 4.53,
      "post1Stock": 18.61,
      "post1Benchmark": 4.48,
      "post7Stock": 26.58,
      "post7Benchmark": 9.96
    },
    {
      "date": "2026-08-04",
      "session": "after_close",
      "preStock": -10.2,
      "preBenchmark": -7.4,
      "post1Stock": -7.04,
      "post1Benchmark": -1.4,
      "post7Stock": -6.86,
      "post7Benchmark": 2.27
    }
  ],
  "AVGO": [
    {
      "date": "2026-03-04",
      "session": "after_close",
      "preStock": -5.65,
      "preBenchmark": -6,
      "post1Stock": 4.8,
      "post1Benchmark": -1.17,
      "post7Stock": 1.46,
      "post7Benchmark": -3.38
    },
    {
      "date": "2026-06-04",
      "session": "after_close",
      "preStock": 15.72,
      "preBenchmark": 14.05,
      "post1Stock": -7.92,
      "post1Benchmark": -10.26,
      "post7Stock": -5.96,
      "post7Benchmark": 3.54
    },
    {
      "date": "2026-09-02",
      "session": "after_close",
      "preStock": 0.33,
      "preBenchmark": -3.85,
      "post1Stock": -2.74,
      "post1Benchmark": 0.11,
      "post7Stock": -6.13,
      "post7Benchmark": -1.83
    }
  ],
  "TSM": [
    {
      "date": "2026-01-15",
      "session": "before_open",
      "preStock": 1.51,
      "preBenchmark": 3.42,
      "post1Stock": 0.22,
      "post1Benchmark": 1.15,
      "post7Stock": -0.97,
      "post7Benchmark": 3.57
    },
    {
      "date": "2026-04-16",
      "session": "before_open",
      "preStock": 9.76,
      "preBenchmark": 16.72,
      "post1Stock": 1.97,
      "post1Benchmark": 2.43,
      "post7Stock": 11.46,
      "post7Benchmark": 11.56
    },
    {
      "date": "2026-07-16",
      "session": "before_open",
      "preStock": -7.15,
      "preBenchmark": -3.89,
      "post1Stock": -2.77,
      "post1Benchmark": -1.63,
      "post7Stock": -2.6,
      "post7Benchmark": -2.63
    }
  ],
  "MU": [
    {
      "date": "2026-03-18",
      "session": "after_close",
      "preStock": 24.68,
      "preBenchmark": 4.29,
      "post1Stock": -3.78,
      "post1Benchmark": 0.87,
      "post7Stock": -22.63,
      "post7Benchmark": -4.33
    },
    {
      "date": "2026-06-24",
      "session": "after_close",
      "preStock": 5.61,
      "preBenchmark": 2.36,
      "post1Stock": 15.74,
      "post1Benchmark": 3.59,
      "post7Stock": -6.08,
      "post7Benchmark": -4.15
    }
  ],
  "AAPL": [
    {
      "date": "2026-01-29",
      "session": "after_close",
      "preStock": 0.36,
      "preBenchmark": 1.45,
      "post1Stock": 0.46,
      "post1Benchmark": -0.94,
      "post7Stock": 6.33,
      "post7Benchmark": -1.88
    },
    {
      "date": "2026-04-30",
      "session": "after_close",
      "preStock": -1.05,
      "preBenchmark": 1.1,
      "post1Stock": 3.24,
      "post1Benchmark": 0.89,
      "post7Stock": 7.86,
      "post7Benchmark": 5.55
    },
    {
      "date": "2026-07-30",
      "session": "after_close",
      "preStock": 3.55,
      "preBenchmark": -4.18,
      "post1Stock": -7.35,
      "post1Benchmark": 1,
      "post7Stock": -7.55,
      "post7Benchmark": 5.9
    }
  ],
  "MSFT": [
    {
      "date": "2026-01-28",
      "session": "after_close",
      "preStock": 5.24,
      "preBenchmark": 1.22,
      "post1Stock": -9.99,
      "post1Benchmark": -0.72,
      "post7Stock": -16.71,
      "post7Benchmark": -3.46
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "preStock": 1.53,
      "preBenchmark": 0.8,
      "post1Stock": -3.93,
      "post1Benchmark": 0.89,
      "post7Stock": -2.2,
      "post7Benchmark": 6.38
    },
    {
      "date": "2026-07-29",
      "session": "after_close",
      "preStock": -0.12,
      "preBenchmark": -2.52,
      "post1Stock": 15.51,
      "post1Benchmark": 2.78,
      "post7Stock": 28.03,
      "post7Benchmark": 9.2
    }
  ],
  "AMZN": [
    {
      "date": "2026-02-05",
      "session": "after_close",
      "preStock": -2.28,
      "preBenchmark": -2.95,
      "post1Stock": -5.55,
      "post1Benchmark": 2.18,
      "post7Stock": -9.67,
      "post7Benchmark": 0.17
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "preStock": 3.65,
      "preBenchmark": 0.8,
      "post1Stock": 0.77,
      "post1Benchmark": 0.89,
      "post7Stock": 3.66,
      "post7Benchmark": 6.38
    },
    {
      "date": "2026-07-30",
      "session": "after_close",
      "preStock": -9.34,
      "preBenchmark": -4.18,
      "post1Stock": 15.32,
      "post1Benchmark": 1,
      "post7Stock": 18.09,
      "post7Benchmark": 5.9
    }
  ],
  "GOOGL": [
    {
      "date": "2026-02-04",
      "session": "after_close",
      "preStock": 3.59,
      "preBenchmark": -1.05,
      "post1Stock": -0.54,
      "post1Benchmark": -1.59,
      "post7Stock": -8.2,
      "post7Benchmark": -1.56
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "preStock": 2.37,
      "preBenchmark": 0.8,
      "post1Stock": 9.96,
      "post1Benchmark": 0.89,
      "post7Stock": 14.53,
      "post7Benchmark": 6.38
    },
    {
      "date": "2026-07-22",
      "session": "after_close",
      "preStock": -2.81,
      "preBenchmark": -1.69,
      "post1Stock": -7.13,
      "post1Benchmark": -2.15,
      "post7Stock": 4.1,
      "post7Benchmark": -1.23
    }
  ],
  "META": [
    {
      "date": "2026-01-28",
      "session": "after_close",
      "preStock": 8.4,
      "preBenchmark": 1.22,
      "post1Stock": 10.4,
      "post1Benchmark": -0.72,
      "post7Stock": -1.09,
      "post7Benchmark": -3.46
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "preStock": -2.5,
      "preBenchmark": 0.8,
      "post1Stock": -8.55,
      "post1Benchmark": 0.89,
      "post7Stock": -8.89,
      "post7Benchmark": 6.38
    },
    {
      "date": "2026-07-29",
      "session": "after_close",
      "preStock": -8.14,
      "preBenchmark": -2.52,
      "post1Stock": -7.95,
      "post1Benchmark": 2.78,
      "post7Stock": 1.11,
      "post7Benchmark": 9.2
    }
  ],
  "TSLA": [
    {
      "date": "2026-01-28",
      "session": "after_close",
      "preStock": -1.75,
      "preBenchmark": 1.22,
      "post1Stock": -3.45,
      "post1Benchmark": -0.72,
      "post7Stock": -4.72,
      "post7Benchmark": -3.46
    },
    {
      "date": "2026-04-22",
      "session": "after_close",
      "preStock": 10.74,
      "preBenchmark": 5.93,
      "post1Stock": -3.56,
      "post1Benchmark": -0.89,
      "post7Stock": 0.85,
      "post7Benchmark": 1.85
    },
    {
      "date": "2026-07-22",
      "session": "after_close",
      "preStock": -7.07,
      "preBenchmark": -1.69,
      "post1Stock": -14.52,
      "post1Benchmark": -2.15,
      "post7Stock": -16.79,
      "post7Benchmark": -1.23
    }
  ]
};
export const earningsBenchmark: Record<string, string> = {
  "NVDA": "SOX",
  "AMD": "SOX",
  "AVGO": "SOX",
  "TSM": "SOX",
  "MU": "SOX",
  "AAPL": "Nasdaq Composite",
  "MSFT": "Nasdaq Composite",
  "AMZN": "Nasdaq Composite",
  "GOOGL": "Nasdaq Composite",
  "META": "Nasdaq Composite",
  "TSLA": "Nasdaq Composite"
};
