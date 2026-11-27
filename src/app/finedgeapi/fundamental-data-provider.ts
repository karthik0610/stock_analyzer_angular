import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { FundamentalPeriod } from './finedgeapi.constants';
import type { FinancialGrowthCagrs } from './revenue-growth';

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
}

export const FUNDAMENTAL_DATA_PROVIDER = new InjectionToken<FundamentalDataProvider>(
  'FUNDAMENTAL_DATA_PROVIDER',
);
