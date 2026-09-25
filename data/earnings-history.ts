// Compact price-response summaries derived from the owner's NasBoard earnings archives.
// Return windows use adjusted closes. After-close: T−7→T0, T0→T+1, T+1→T+7.
// Before-open: T−7→T−1, T−1→T0, T0→T+7.
// The full price sequence remains in NasBoard; no underlying closes are published here.
export const earningsHistoryAsOf = "2026-09-25";
export const earningsHistory: Record<string, Array<{
  date: string; session: "after_close" | "before_open";
  leadStock: number; leadBenchmark: number;
  firstStock: number; firstBenchmark: number;
  followStock: number; followBenchmark: number;
  totalStock: number; totalBenchmark: number;
}>> = {
  "NVDA": [
    {
      "date": "2026-02-25",
      "session": "after_close",
      "leadStock": 6.97,
      "leadBenchmark": 4.05,
      "firstStock": -5.46,
      "firstBenchmark": -3.19,
      "followStock": -3.82,
      "followBenchmark": -8.33,
      "totalStock": -9.07,
      "totalBenchmark": -11.25
    },
    {
      "date": "2026-05-20",
      "session": "after_close",
      "leadStock": 1.84,
      "leadBenchmark": -2.22,
      "firstStock": -1.77,
      "firstBenchmark": 1.28,
      "followStock": 2.21,
      "followBenchmark": 8.37,
      "totalStock": 0.4,
      "totalBenchmark": 9.75
    },
    {
      "date": "2026-08-26",
      "session": "after_close",
      "leadStock": -6.82,
      "leadBenchmark": -8,
      "firstStock": 8.74,
      "firstBenchmark": 2.33,
      "followStock": 1.04,
      "followBenchmark": -1.24,
      "totalStock": 9.87,
      "totalBenchmark": 1.07
    }
  ],
  "AMD": [
    {
      "date": "2026-02-03",
      "session": "after_close",
      "leadStock": -6.77,
      "leadBenchmark": 0.11,
      "firstStock": -17.31,
      "firstBenchmark": -4.36,
      "followStock": 2.87,
      "followBenchmark": 6.11,
      "totalStock": -14.94,
      "totalBenchmark": 1.49
    },
    {
      "date": "2026-05-05",
      "session": "after_close",
      "leadStock": 2.14,
      "leadBenchmark": 4.44,
      "firstStock": 18.61,
      "firstBenchmark": 4.48,
      "followStock": 6.72,
      "followBenchmark": 5.24,
      "totalStock": 26.58,
      "totalBenchmark": 9.96
    },
    {
      "date": "2026-08-04",
      "session": "after_close",
      "leadStock": -0.65,
      "leadBenchmark": 3.05,
      "firstStock": -7.04,
      "firstBenchmark": -1.4,
      "followStock": 0.2,
      "followBenchmark": 3.72,
      "totalStock": -6.86,
      "totalBenchmark": 2.27
    }
  ],
  "AVGO": [
    {
      "date": "2026-03-04",
      "session": "after_close",
      "leadStock": -3.88,
      "leadBenchmark": -3.64,
      "firstStock": 4.8,
      "firstBenchmark": -1.17,
      "followStock": -3.19,
      "followBenchmark": -2.24,
      "totalStock": 1.46,
      "totalBenchmark": -3.38
    },
    {
      "date": "2026-06-04",
      "session": "after_close",
      "leadStock": -0.73,
      "leadBenchmark": 5.75,
      "firstStock": -7.92,
      "firstBenchmark": -10.26,
      "followStock": 2.13,
      "followBenchmark": 15.37,
      "totalStock": -5.96,
      "totalBenchmark": 3.54
    },
    {
      "date": "2026-09-02",
      "session": "after_close",
      "leadStock": 2.36,
      "leadBenchmark": -0.73,
      "firstStock": -2.74,
      "firstBenchmark": 0.11,
      "followStock": -3.48,
      "followBenchmark": -1.95,
      "totalStock": -6.13,
      "totalBenchmark": -1.83
    }
  ],
  "TSM": [
    {
      "date": "2026-01-15",
      "session": "before_open",
      "leadStock": -0.1,
      "leadBenchmark": 0.66,
      "firstStock": 4.44,
      "firstBenchmark": 1.76,
      "followStock": -0.97,
      "followBenchmark": 3.57,
      "totalStock": 3.43,
      "totalBenchmark": 5.4
    },
    {
      "date": "2026-04-16",
      "session": "before_open",
      "leadStock": 8.62,
      "leadBenchmark": 15.44,
      "firstStock": -3.13,
      "firstBenchmark": 0.97,
      "followStock": 11.46,
      "followBenchmark": 11.56,
      "totalStock": 7.97,
      "totalBenchmark": 12.65
    },
    {
      "date": "2026-07-16",
      "session": "before_open",
      "leadStock": -3.03,
      "leadBenchmark": 0.8,
      "firstStock": -2.32,
      "firstBenchmark": -4.29,
      "followStock": -2.6,
      "followBenchmark": -2.63,
      "totalStock": -4.86,
      "totalBenchmark": -6.81
    }
  ],
  "MU": [
    {
      "date": "2026-03-18",
      "session": "after_close",
      "leadStock": 18.6,
      "leadBenchmark": -0.2,
      "firstStock": -3.78,
      "firstBenchmark": 0.87,
      "followStock": -19.59,
      "followBenchmark": -5.16,
      "totalStock": -22.63,
      "totalBenchmark": -4.33
    },
    {
      "date": "2026-06-24",
      "session": "after_close",
      "leadStock": 6.82,
      "leadBenchmark": 0.65,
      "firstStock": 15.74,
      "firstBenchmark": 3.59,
      "followStock": -18.85,
      "followBenchmark": -7.47,
      "totalStock": -6.08,
      "totalBenchmark": -4.15
    }
  ],
  "AAPL": [
    {
      "date": "2026-01-29",
      "session": "after_close",
      "leadStock": 4.69,
      "leadBenchmark": 3.18,
      "firstStock": 0.46,
      "firstBenchmark": -0.94,
      "followStock": 5.83,
      "followBenchmark": -0.95,
      "totalStock": 6.33,
      "totalBenchmark": -1.88
    },
    {
      "date": "2026-04-30",
      "session": "after_close",
      "leadStock": 1.95,
      "leadBenchmark": 2.61,
      "firstStock": 3.24,
      "firstBenchmark": 0.89,
      "followStock": 4.48,
      "followBenchmark": 4.62,
      "totalStock": 7.86,
      "totalBenchmark": 5.55
    },
    {
      "date": "2026-07-30",
      "session": "after_close",
      "leadStock": 1.74,
      "leadBenchmark": -2.77,
      "firstStock": -7.35,
      "firstBenchmark": 1,
      "followStock": -0.21,
      "followBenchmark": 4.85,
      "totalStock": -7.55,
      "totalBenchmark": 5.9
    }
  ],
  "MSFT": [
    {
      "date": "2026-01-28",
      "session": "after_close",
      "leadStock": 4.73,
      "leadBenchmark": 1.45,
      "firstStock": -9.99,
      "firstBenchmark": -0.72,
      "followStock": -7.46,
      "followBenchmark": -2.76,
      "totalStock": -16.71,
      "totalBenchmark": -3.46
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "leadStock": 1.53,
      "leadBenchmark": 1.1,
      "firstStock": -3.93,
      "firstBenchmark": 0.89,
      "followStock": 1.8,
      "followBenchmark": 5.44,
      "totalStock": -2.2,
      "totalBenchmark": 6.38
    },
    {
      "date": "2026-07-29",
      "session": "after_close",
      "leadStock": -2.92,
      "leadBenchmark": -4.18,
      "firstStock": 15.51,
      "firstBenchmark": 2.78,
      "followStock": 10.84,
      "followBenchmark": 6.24,
      "totalStock": 28.03,
      "totalBenchmark": 9.2
    }
  ],
  "AMZN": [
    {
      "date": "2026-02-05",
      "session": "after_close",
      "leadStock": -8.99,
      "leadBenchmark": -5.36,
      "firstStock": -5.55,
      "firstBenchmark": 2.18,
      "followStock": -4.36,
      "followBenchmark": -1.97,
      "totalStock": -9.67,
      "totalBenchmark": 0.17
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "leadStock": 5.94,
      "leadBenchmark": 1.1,
      "firstStock": 0.77,
      "firstBenchmark": 0.89,
      "followStock": 2.87,
      "followBenchmark": 5.44,
      "totalStock": 3.66,
      "totalBenchmark": 6.38
    },
    {
      "date": "2026-07-30",
      "session": "after_close",
      "leadStock": -4.87,
      "leadBenchmark": -2.77,
      "firstStock": 15.32,
      "firstBenchmark": 1,
      "followStock": 2.4,
      "followBenchmark": 4.85,
      "totalStock": 18.08,
      "totalBenchmark": 5.9
    }
  ],
  "GOOGL": [
    {
      "date": "2026-02-04",
      "session": "after_close",
      "leadStock": -0.07,
      "leadBenchmark": -2.95,
      "firstStock": -0.54,
      "firstBenchmark": -1.59,
      "followStock": -7.71,
      "followBenchmark": 0.03,
      "totalStock": -8.2,
      "totalBenchmark": -1.56
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "leadStock": 3.71,
      "leadBenchmark": 1.1,
      "firstStock": 9.96,
      "firstBenchmark": 0.89,
      "followStock": 4.16,
      "followBenchmark": 5.44,
      "totalStock": 14.53,
      "totalBenchmark": 6.38
    },
    {
      "date": "2026-07-22",
      "session": "after_close",
      "leadStock": -2.96,
      "leadBenchmark": -0.7,
      "firstStock": -7.13,
      "firstBenchmark": -2.15,
      "followStock": 12.1,
      "followBenchmark": 0.94,
      "totalStock": 4.1,
      "totalBenchmark": -1.23
    }
  ],
  "META": [
    {
      "date": "2026-01-28",
      "session": "after_close",
      "leadStock": 7.82,
      "leadBenchmark": 1.45,
      "firstStock": 10.4,
      "firstBenchmark": -0.72,
      "followStock": -10.41,
      "followBenchmark": -2.76,
      "totalStock": -1.09,
      "totalBenchmark": -3.46
    },
    {
      "date": "2026-04-29",
      "session": "after_close",
      "leadStock": -0.27,
      "leadBenchmark": 1.1,
      "firstStock": -8.55,
      "firstBenchmark": 0.89,
      "followStock": -0.37,
      "followBenchmark": 5.44,
      "totalStock": -8.89,
      "totalBenchmark": 6.38
    },
    {
      "date": "2026-07-29",
      "session": "after_close",
      "leadStock": -9.33,
      "leadBenchmark": -4.18,
      "firstStock": -7.95,
      "firstBenchmark": 2.78,
      "followStock": 9.85,
      "followBenchmark": 6.24,
      "totalStock": 1.11,
      "totalBenchmark": 9.2
    }
  ],
  "TSLA": [
    {
      "date": "2026-01-28",
      "session": "after_close",
      "leadStock": -1.38,
      "leadBenchmark": 1.45,
      "firstStock": -3.45,
      "firstBenchmark": -0.72,
      "followStock": -1.31,
      "followBenchmark": -2.76,
      "totalStock": -4.72,
      "totalBenchmark": -3.46
    },
    {
      "date": "2026-04-22",
      "session": "after_close",
      "leadStock": 9.96,
      "leadBenchmark": 6.36,
      "firstStock": -3.56,
      "firstBenchmark": -0.89,
      "followStock": 4.58,
      "followBenchmark": 2.77,
      "totalStock": 0.85,
      "totalBenchmark": 1.85
    },
    {
      "date": "2026-07-22",
      "session": "after_close",
      "leadStock": -5.26,
      "leadBenchmark": -0.7,
      "firstStock": -14.52,
      "firstBenchmark": -2.15,
      "followStock": -2.65,
      "followBenchmark": 0.94,
      "totalStock": -16.79,
      "totalBenchmark": -1.23
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
