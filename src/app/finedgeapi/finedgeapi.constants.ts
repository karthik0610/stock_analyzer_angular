export const FINEDGE_API_BASE_URL = 'https://data.finedgeapi.com/api/v1';

// Add your key here for local development. Use a server-side proxy in production.
export const FINEDGE_API_TOKEN = 'q756puhby66gvf5eqlfp2iefo6sdfj2g3r4et76u34nsicroen4frntihio2jr25mhvhdt4ef6gye55gb7mnrzl26y';

export const FUNDAMENTAL_PERIODS = ['annual', 'quarterly', 'halfyearly', 'ttm', 'ytd'] as const;
export type FundamentalPeriod = (typeof FUNDAMENTAL_PERIODS)[number];

export const FINEDGE_API_ENDPOINTS = {
  stockSymbols: `${FINEDGE_API_BASE_URL}/stock-symbols`,
  financials: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/financials/${encodeURIComponent(symbol)}`,
  ratios: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/ratios/${encodeURIComponent(symbol)}`,
  financialMetrics: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/financial-metrics/${encodeURIComponent(symbol)}`,
  annualPriceRatios: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/annual-price-ratios/${encodeURIComponent(symbol)}`,
  shareholdingPattern: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/shareholdings/pattern/${encodeURIComponent(symbol)}`,
  sectorPeers: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/peers/${encodeURIComponent(symbol)}`,
  companyProfile: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/company-profile/${encodeURIComponent(symbol)}`,
  segmentRevenue: (symbol: string) =>
    `${FINEDGE_API_BASE_URL}/segment-revenue/${encodeURIComponent(symbol)}`,
  quote: `${FINEDGE_API_BASE_URL}/quote`,
} as const;

export const FINEDGE_STATEMENT_CODES = {
  profitAndLoss: 'pl',
  balanceSheet: 'bs',
  cashFlow: 'cf',
} as const;

export const FINEDGE_STATEMENTS_BY_PERIOD: Record<
  FundamentalPeriod,
  readonly string[]
> = {
  annual: Object.values(FINEDGE_STATEMENT_CODES),
  quarterly: Object.values(FINEDGE_STATEMENT_CODES),
  halfyearly: [FINEDGE_STATEMENT_CODES.profitAndLoss],
  ttm: [FINEDGE_STATEMENT_CODES.profitAndLoss],
  ytd: [FINEDGE_STATEMENT_CODES.balanceSheet, FINEDGE_STATEMENT_CODES.cashFlow],
};

export const FINEDGE_PROFITABILITY_RATIO_TYPE = 'pr';
export const FINEDGE_GROWTH_METRIC_TYPE = 'gr';
