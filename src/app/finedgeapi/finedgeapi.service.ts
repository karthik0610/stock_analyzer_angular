import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import {
  FINEDGE_API_ENDPOINTS,
  FINEDGE_API_TOKEN,
  FINEDGE_GROWTH_METRIC_TYPE,
  FINEDGE_PROFITABILITY_RATIO_TYPE,
  FINEDGE_STATEMENTS_BY_PERIOD,
  FINEDGE_STATEMENT_CODES,
} from './finedgeapi.constants';
import type { FundamentalPeriod } from './finedgeapi.constants';
import { calculateFinancialGrowthCagrs } from './revenue-growth';
import type { FinancialGrowthCagrs } from './revenue-growth';
import { calculateShareholdingPattern } from './shareholding-pattern';
import type { ShareholdingPatternMetrics } from './shareholding-pattern';
import { parseSectorPeers } from './sector-peers';
import { parseCompanyDescription } from './company-profile';
import { parseLatestSegmentRevenueNames } from './segment-revenue';
import type { SegmentRevenueNames } from './segment-revenue';
import { parseStockQuote } from './quote';
import type { StockQuote } from './quote';
import {
  type CompanySymbol,
  type FundamentalDataProvider,
  type FundamentalDataSection,
  type FundamentalQueryOptions,
} from './fundamental-data-provider';

@Injectable({ providedIn: 'root' })
export class FinEdgeApiService implements FundamentalDataProvider {
  private readonly http = inject(HttpClient);
  readonly providerName = 'FinEdge API';

  getSymbols(): Observable<CompanySymbol[]> {
    return this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.stockSymbols, { params: this.createParams() })
      .pipe(map((payload) => this.normalizeSymbols(payload)));
  }

  getFinancialGrowthCagrs(symbol: string, years: number): Observable<FinancialGrowthCagrs> {
    const financialsEndpoint = FINEDGE_API_ENDPOINTS.financials(symbol);
    const statementParams = { statement_type: 'c', period: 'annual' };
    const profitAndLossRequest = this.http.get<unknown>(financialsEndpoint, {
      params: this.createParams({
        ...statementParams,
        statement_code: FINEDGE_STATEMENT_CODES.profitAndLoss,
      }),
    });
    const balanceSheetRequest = this.http
      .get<unknown>(financialsEndpoint, {
        params: this.createParams({
          ...statementParams,
          statement_code: FINEDGE_STATEMENT_CODES.balanceSheet,
        }),
      })
      .pipe(
        map((data) => ({ data, error: null as string | null })),
        catchError((error: unknown) =>
          of({ data: null, error: this.describeError(error) }),
        ),
      );
    const annualPriceRatiosRequest = this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.annualPriceRatios(symbol), {
        params: this.createParams({ statement_type: 's' }),
      })
      .pipe(
        map((data) => ({ data, error: null as string | null })),
        catchError((error: unknown) =>
          of({ data: null, error: this.describeError(error) }),
        ),
      );

    return forkJoin({
      profitAndLoss: profitAndLossRequest,
      balanceSheet: balanceSheetRequest,
      annualPriceRatios: annualPriceRatiosRequest,
    }).pipe(
      map(({ profitAndLoss, balanceSheet, annualPriceRatios }) => {
        const metrics = calculateFinancialGrowthCagrs(
          profitAndLoss,
          years,
          balanceSheet.data,
          annualPriceRatios.data,
        );
        return {
          ...metrics,
          ...(balanceSheet.error ? { balanceSheetError: balanceSheet.error } : {}),
          ...(annualPriceRatios.error
            ? { annualPriceRatiosError: annualPriceRatios.error }
            : {}),
        };
      }),
    );
  }

  getShareholdingPattern(symbol: string): Observable<ShareholdingPatternMetrics> {
    return this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.shareholdingPattern(symbol), {
        params: this.createParams({ period: 'quarterly' }),
      })
      .pipe(map(calculateShareholdingPattern));
  }

  getSectorPeers(symbol: string): Observable<string[]> {
    return this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.sectorPeers(symbol), {
        params: this.createParams({ group: 'sector' }),
      })
      .pipe(map(parseSectorPeers));
  }

  getCompanyDescription(symbol: string): Observable<string> {
    return this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.companyProfile(symbol), {
        params: this.createParams(),
      })
      .pipe(map(parseCompanyDescription));
  }

  getLatestSegmentRevenueNames(symbol: string): Observable<SegmentRevenueNames> {
    return this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.segmentRevenue(symbol), {
        params: this.createParams({
          statement_type: 's',
          statement_code: FINEDGE_STATEMENT_CODES.profitAndLoss,
          period: 'annual',
        }),
      })
      .pipe(map(parseLatestSegmentRevenueNames));
  }

  getQuote(symbol: string): Observable<StockQuote> {
    return this.http
      .get<unknown>(FINEDGE_API_ENDPOINTS.quote, {
        params: this.createParams({ symbol }),
      })
      .pipe(map((payload) => parseStockQuote(payload, symbol)));
  }

  getFundamentals(
    symbol: string,
    options: FundamentalQueryOptions,
  ): Observable<FundamentalDataSection[]> {
    const commonParams = {
      statement_type: options.statementType,
      period: options.period,
    };
    const statementSections = [
      {
        id: 'profit-and-loss',
        title: 'Profit & Loss',
        statementCode: FINEDGE_STATEMENT_CODES.profitAndLoss,
      },
      {
        id: 'balance-sheet',
        title: 'Balance Sheet',
        statementCode: FINEDGE_STATEMENT_CODES.balanceSheet,
      },
      {
        id: 'cash-flow',
        title: 'Cash Flow',
        statementCode: FINEDGE_STATEMENT_CODES.cashFlow,
      },
    ];

    return forkJoin([
      ...statementSections
        .filter(({ statementCode }) =>
          FINEDGE_STATEMENTS_BY_PERIOD[options.period].includes(statementCode),
        )
        .map(({ id, title, statementCode }) =>
          this.fetchSection(
            id,
            title,
            FINEDGE_API_ENDPOINTS.financials(symbol),
            { ...commonParams, statement_code: statementCode },
          ),
        ),
      this.fetchSection(
        'profitability-ratios',
        'Profitability Ratios',
        FINEDGE_API_ENDPOINTS.ratios(symbol),
        {
          statement_type: options.statementType,
          ratio_type: FINEDGE_PROFITABILITY_RATIO_TYPE,
        },
      ),
      this.fetchSection(
        'growth-metrics',
        'Growth Metrics',
        FINEDGE_API_ENDPOINTS.financialMetrics(symbol),
        {
          statement_type: options.statementType,
          ratio_type: FINEDGE_GROWTH_METRIC_TYPE,
        },
      ),
    ]);
  }

  private fetchSection(
    id: string,
    title: string,
    endpoint: string,
    query: Record<string, string>,
  ): Observable<FundamentalDataSection> {
    return this.http.get<unknown>(endpoint, { params: this.createParams(query) }).pipe(
      map((data) => ({ id, title, endpoint, status: 'success' as const, data })),
      catchError((error: unknown) =>
        of({
          id,
          title,
          endpoint,
          status: 'error' as const,
          error: this.describeError(error),
        }),
      ),
    );
  }

  private createParams(extra: Record<string, string> = {}): HttpParams {
    return new HttpParams({ fromObject: { ...extra, token: FINEDGE_API_TOKEN } });
  }

  private normalizeSymbols(payload: unknown): CompanySymbol[] {
    const records = this.findSymbolRecords(payload);
    if (!records) {
      return [];
    }

    return records
      .map((record) => {
        if (typeof record === 'string') {
          return { symbol: record, name: record };
        }

        if (!this.isRecord(record)) {
          return null;
        }

        const symbolValue =
          record['symbol'] ??
          record['ticker'] ??
          record['nse_symbol'] ??
          record['nseSymbol'] ??
          record['bse_symbol'] ??
          record['bseSymbol'] ??
          record['code'];
        if (
          (typeof symbolValue !== 'string' && typeof symbolValue !== 'number') ||
          String(symbolValue).trim().length === 0
        ) {
          return null;
        }

        const symbol = String(symbolValue).trim();
        const nameValue = record['name'] ?? record['company_name'] ?? record['companyName'];
        return {
          symbol,
          name: typeof nameValue === 'string' && nameValue.trim() ? nameValue.trim() : symbol,
        };
      })
      .filter((company): company is CompanySymbol => company !== null)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private findSymbolRecords(value: unknown): unknown[] | null {
    if (Array.isArray(value)) {
      return value;
    }

    if (!this.isRecord(value)) {
      return null;
    }

    const preferredKeys = ['data', 'results', 'symbols', 'stocks', 'companies'];
    for (const key of preferredKeys) {
      if (key in value) {
        const found = this.findSymbolRecords(value[key]);
        if (found) {
          return found;
        }
      }
    }

    for (const nested of Object.values(value)) {
      const found = this.findSymbolRecords(nested);
      if (found) {
        return found;
      }
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage =
        this.isRecord(error.error) && typeof error.error['message'] === 'string'
          ? error.error['message']
          : null;
      return apiMessage ?? `FinEdge request failed (HTTP ${error.status || 'network error'}).`;
    }

    return error instanceof Error ? error.message : 'An unknown FinEdge API error occurred.';
  }
}
