import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { FundamentalPeriod } from './finedgeapi.constants';
import type { FinancialGrowthCagrs } from './revenue-growth';
import type { ShareholdingPatternMetrics } from './shareholding-pattern';
import type { SegmentRevenueNames } from './segment-revenue';
import type { StockQuote } from './quote';

export interface CompanySymbol {
  symbol: string;
  name: string;
}

export interface FundamentalQueryOptions {
  period: FundamentalPeriod;
  statementType: 's' | 'c';
}

export interface FundamentalDataSection {
  id: string;
  title: string;
  endpoint: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
}

export interface FundamentalDataProvider {
  readonly providerName: string;
  getSymbols(): Observable<CompanySymbol[]>;
  getFundamentals(
    symbol: string,
    options: FundamentalQueryOptions,
  ): Observable<FundamentalDataSection[]>;
  getFinancialGrowthCagrs(symbol: string, years: number): Observable<FinancialGrowthCagrs>;
  getShareholdingPattern(symbol: string): Observable<ShareholdingPatternMetrics>;
  getSectorPeers(symbol: string): Observable<string[]>;
  getCompanyDescription(symbol: string): Observable<string>;
  getLatestSegmentRevenueNames(symbol: string): Observable<SegmentRevenueNames>;
  getQuote(symbol: string): Observable<StockQuote>;
}

export const FUNDAMENTAL_DATA_PROVIDER = new InjectionToken<FundamentalDataProvider>(
  'FUNDAMENTAL_DATA_PROVIDER',
);
