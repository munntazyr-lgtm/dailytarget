export interface Zone {
  id: string;
  name: string;
  minStd: number | null;
  minFixed: boolean;
  isProjects?: boolean;
}

export interface Customer {
  name: string;
  type: string;
}

export interface CustomerIntel {
  last3wAvgDaily: number;
  daysSinceLastReceipt: number;
  pendingDuesPct: number;
  weeklyTarget: number;
  weekToDateActual: number;
  consistencyPct: number;
  growthTrend: number;
  ytdMT: number;
  ytdLastYearMT: number; // Added YTD Last Year
  retention: number;
  creditLimitMT: number; // Added Credit Limit
}

export interface ZoneAllocation {
  pct: number;
  qty: number;
  ret: number;
}

export interface DailyTarget {
  date: string;
  total: number;
  globalRet: number;
  zones: Record<string, ZoneAllocation>;
}

export interface ScoredCustomer {
  c: Customer;
  ci: number;
  intel: CustomerIntel;
  score: number;
  priority: 'high' | 'med' | 'low';
  tier: 'A' | 'B' | 'C';
  tierMargin: number;
  scores: {
    retention: number;
    ytd: number;
    consistency: number;
    credit: number;
  };
  suggestMT: number;
  rawSuggest: number;
}
