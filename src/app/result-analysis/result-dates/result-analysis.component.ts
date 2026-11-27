import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import type { Subscription } from 'rxjs';
import { AnalysisTileComponent } from '../analysis-tile/analysis-tile.component';
import { FinalCallTileComponent } from '../final-call-tile/final-call-tile.component';
import { QuoteSnapshotComponent } from '../quote-snapshot/quote-snapshot.component';
import type { StockSymbol } from '../final-call-tile/final-call-engine';
import { stockEvaluationSamples } from '../final-call-tile/final-call-sample-data';
import {
  getAnalysisCategoriesForStock,
  type AnalysisCategory,
  type AnalysisStatus,
} from '../analysis-categories';
import type { AverageMarketCapStock } from '../average-market-cap-stocks';
import { FUNDAMENTAL_DATA_PROVIDER } from '../../finedgeapi/fundamental-data-provider';
import type {
  FinancialAnnualPriceRatios,
  FinancialGrowthCagrs,
  FinancialMetricCagr,
  FinancialMetricEps,
  FinancialMetricMargin,
  FinancialMetricOperatingMargin,
  FinancialMetricRoa,
  FinancialMetricRoce,
  FinancialMetricRoe,
} from '../../finedgeapi/revenue-growth';
import type {
  ShareholdingPatternMetrics,
  ShareholdingPosition,
} from '../../finedgeapi/shareholding-pattern';
import type { SegmentRevenueNames } from '../../finedgeapi/segment-revenue';
import type { StockQuote } from '../../finedgeapi/quote';

@Component({
  selector: 'app-result-analysis',
  standalone: true,
  imports: [AnalysisTileComponent, FinalCallTileComponent, QuoteSnapshotComponent],
  templateUrl: './result-analysis.component.html',
  styleUrl: './result-analysis.component.scss',
})
export class ResultAnalysisComponent implements OnInit, OnDestroy {
  private readonly fundamentalDataProvider = inject(FUNDAMENTAL_DATA_PROVIDER);
  stocks: AverageMarketCapStock[] = [];
  selectedStock: AverageMarketCapStock | null = null;
  analysisCategories: AnalysisCategory[] = [];
  searchTerm = '';
  isLoadingStocks = true;
  stockLoadError = false;
  isLoading = false;
  quote: StockQuote | null = null;
  isLoadingQuote = false;
  quoteError: string | null = null;
  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;
  private financialGrowthSubscription: Subscription | null = null;
  private shareholdingSubscription: Subscription | null = null;
  private sectorPeersSubscription: Subscription | null = null;
  private companyProfileSubscription: Subscription | null = null;
  private segmentRevenueSubscription: Subscription | null = null;
  private quoteSubscription: Subscription | null = null;

  get filteredStocks(): AverageMarketCapStock[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.stocks;
    }

    return this.stocks.filter((stock) =>
      [stock.name, stock.symbol, stock.bseSymbol ?? '', stock.nseSymbol ?? '']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }

  ngOnInit(): void {
    void this.loadStocks();
  }

  updateSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchTerm = event.target.value;
    }
  }

  selectStock(stock: AverageMarketCapStock): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.selectedStock = stock;
    this.analysisCategories = getAnalysisCategoriesForStock(stock.symbol);
    this.setBusinessPoint('Company', stock.name, 'Selected listed stock.', 'neutral');
    this.loadFinancialGrowth(stock);
    this.loadShareholdingPattern(stock);
    this.loadSectorPeers(stock);
    this.loadCompanyDescription(stock);
    this.loadLatestSegmentRevenueNames(stock);
    this.loadQuote(stock);
    this.isLoading = true;
    this.loadingTimeout = setTimeout(() => {
      this.isLoading = false;
      this.loadingTimeout = null;
    }, 700);
  }

  private async loadStocks(): Promise<void> {
    try {
      const { averageMarketCapStocks } = await import('../average-market-cap-stocks');
      if (averageMarketCapStocks.length === 0) {
        throw new Error('The market capitalization workbook contains no stock records.');
      }

      this.stocks = averageMarketCapStocks;
      this.selectedStock = this.stocks[0];
      this.analysisCategories = getAnalysisCategoriesForStock(this.selectedStock.symbol);
      this.setBusinessPoint('Company', this.selectedStock.name, 'Selected listed stock.', 'neutral');
      this.loadFinancialGrowth(this.selectedStock);
      this.loadShareholdingPattern(this.selectedStock);
      this.loadSectorPeers(this.selectedStock);
      this.loadCompanyDescription(this.selectedStock);
      this.loadLatestSegmentRevenueNames(this.selectedStock);
      this.loadQuote(this.selectedStock);
    } catch (error) {
      console.error('Failed to load stock records from the market capitalization workbook.', error);
      this.stockLoadError = true;
    } finally {
      this.isLoadingStocks = false;
    }
  }

  hasFinalCallSample(symbol: string): symbol is StockSymbol {
    return Object.prototype.hasOwnProperty.call(stockEvaluationSamples, symbol);
  }

  private loadFinancialGrowth(stock: AverageMarketCapStock): void {
    this.financialGrowthSubscription?.unsubscribe();
    this.setGrowthPoint(
      'Revenue growth',
      'Loading…',
      'Loading consolidated annual P&L income from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'Net profit growth',
      'Loading…',
      'Loading consolidated annual P&L profit from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'Net Profit Margin (NPM)',
      'Loading…',
      'Loading the latest consolidated annual P&L from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'Operating Profit Margin (OPM / EBITDA)',
      'Loading…',
      'Loading the latest consolidated annual P&L from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'EPS (Earnings Per Share)',
      'Loading…',
      'Loading diluted EPS from the latest consolidated annual P&L.',
      'neutral',
    );
    this.setGrowthPoint(
      'ROE (Return on Equity)',
      'Loading…',
      'Loading the latest consolidated annual P&L and balance sheet from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'ROCE (Return on Capital Employed)',
      'Loading…',
      'Loading the latest consolidated annual P&L and balance sheet from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'ROA (Return on Assets)',
      'Loading…',
      'Loading the latest consolidated annual P&L and balance sheet from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'PE Ratio',
      'Loading…',
      'Loading standalone annual price ratios from FinEdge API.',
      'neutral',
    );
    this.setGrowthPoint(
      'PB Ratio (Price-to-Book)',
      'Loading…',
      'Loading standalone annual price ratios from FinEdge API.',
      'neutral',
    );

    this.financialGrowthSubscription = this.fundamentalDataProvider
      .getFinancialGrowthCagrs(stock.symbol, 3)
      .subscribe({
        next: (result: FinancialGrowthCagrs) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.applyGrowthResult('Revenue growth', result.revenue, 'income');
          this.applyGrowthResult('Net profit growth', result.netProfit, 'profit for the period');
          this.applyProfitMarginResult(result.netProfitMargin);
          this.applyOperatingMarginResult(result.operatingProfitMargin);
          this.applyEpsResult(result.dilutedEps);
          this.applyRoeResult(result.returnOnEquity, result.balanceSheetError);
          this.applyRoceResult(result.roce, result.balanceSheetError);
          this.applyRoaResult(result.returnOnAssets, result.balanceSheetError);
          this.applyAnnualPriceRatiosResult(
            result.annualPriceRatios,
            result.annualPriceRatiosError,
          );
        },
        error: (error: unknown) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          const reason =
            error instanceof Error ? `FinEdge API error: ${error.message}` : 'FinEdge API request failed.';
          this.setGrowthPoint('Revenue growth', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('Net profit growth', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('Net Profit Margin (NPM)', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('Operating Profit Margin (OPM / EBITDA)', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('EPS (Earnings Per Share)', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('ROE (Return on Equity)', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('ROCE (Return on Capital Employed)', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('ROA (Return on Assets)', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('PE Ratio', 'Unavailable', reason, 'neutral');
          this.setGrowthPoint('PB Ratio (Price-to-Book)', 'Unavailable', reason, 'neutral');
        },
      });
  }

  private loadShareholdingPattern(stock: AverageMarketCapStock): void {
    this.shareholdingSubscription?.unsubscribe();
    const loadingDetail = 'Loading the latest FinEdge quarterly shareholding pattern.';
    this.setShareholdingPoint('Promoter Holding', 'Loading…', loadingDetail, 'neutral');
    this.setShareholdingPoint('FII Holding', 'Loading…', loadingDetail, 'neutral');
    this.setShareholdingPoint('DII Holding', 'Loading…', loadingDetail, 'neutral');
    this.setShareholdingPoint('Retail Holding', 'Loading…', loadingDetail, 'neutral');
    this.setShareholdingPoint(
      'Quarter-on-Quarter Change',
      'Loading…',
      'Loading FII and DII quarterly changes from FinEdge.',
      'neutral',
    );

    this.shareholdingSubscription = this.fundamentalDataProvider
      .getShareholdingPattern(stock.symbol)
      .subscribe({
        next: (result) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.applyShareholdingResult(result);
        },
        error: (error: unknown) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          const reason =
            error instanceof Error
              ? `FinEdge shareholding request failed: ${error.message}`
              : 'FinEdge shareholding request failed.';
          this.setShareholdingPoint('Promoter Holding', 'Unavailable', reason, 'neutral');
          this.setShareholdingPoint('FII Holding', 'Unavailable', reason, 'neutral');
          this.setShareholdingPoint('DII Holding', 'Unavailable', reason, 'neutral');
          this.setShareholdingPoint('Retail Holding', 'Unavailable', reason, 'neutral');
          this.setShareholdingPoint('Quarter-on-Quarter Change', 'Unavailable', reason, 'neutral');
        },
      });
  }

  private loadSectorPeers(stock: AverageMarketCapStock): void {
    this.sectorPeersSubscription?.unsubscribe();
    this.setBusinessPoint(
      'Competitors and market position',
      'Loading…',
      'Loading FinEdge sector peers.',
      'neutral',
    );

    this.sectorPeersSubscription = this.fundamentalDataProvider
      .getSectorPeers(stock.symbol)
      .subscribe({
        next: (peers) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          const ownSymbol = stock.symbol.trim().toUpperCase();
          const competitors = peers.filter((peer) => peer.toUpperCase() !== ownSymbol);
          if (competitors.length === 0) {
            this.setBusinessPoint(
              'Competitors and market position',
              'No sector peers returned',
              `FinEdge returned no other sector peers for ${stock.symbol}.`,
              'neutral',
            );
            return;
          }

          this.setBusinessPoint(
            'Competitors and market position',
            `${competitors.length} sector peers`,
            `FinEdge sector peer symbols: ${competitors.join(', ')}.`,
            'neutral',
          );
        },
        error: (error: unknown) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.setBusinessPoint(
            'Competitors and market position',
            'Unavailable',
            `FinEdge sector peers request failed: ${this.describeBusinessDataError(error)}`,
            'neutral',
          );
        },
      });
  }

  private loadCompanyDescription(stock: AverageMarketCapStock): void {
    this.companyProfileSubscription?.unsubscribe();
    this.setBusinessPoint(
      'What does the company do?',
      'Loading…',
      'Loading the FinEdge company profile description.',
      'neutral',
    );

    this.companyProfileSubscription = this.fundamentalDataProvider
      .getCompanyDescription(stock.symbol)
      .subscribe({
        next: (description) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.setBusinessPoint(
            'What does the company do?',
            description,
            'FinEdge company profile description.',
            'neutral',
          );
        },
        error: (error: unknown) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.setBusinessPoint(
            'What does the company do?',
            'Unavailable',
            `FinEdge company profile request failed: ${this.describeBusinessDataError(error)}`,
            'neutral',
          );
        },
      });
  }

  private loadLatestSegmentRevenueNames(stock: AverageMarketCapStock): void {
    this.segmentRevenueSubscription?.unsubscribe();
    this.setBusinessPoint(
      'How does it make money?',
      'Loading…',
      'Loading the latest FinEdge annual segment names.',
      'neutral',
    );

    this.segmentRevenueSubscription = this.fundamentalDataProvider
      .getLatestSegmentRevenueNames(stock.symbol)
      .subscribe({
        next: (result: SegmentRevenueNames) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.setBusinessPoint(
            'How does it make money?',
            result.names.join(', '),
            `FinEdge standalone annual segment names for ${result.header}.`,
            'neutral',
          );
        },
        error: (error: unknown) => {
          if (this.selectedStock?.symbol !== stock.symbol) {
            return;
          }

          this.setBusinessPoint(
            'How does it make money?',
            'Unavailable',
            `FinEdge segment revenue request failed: ${this.describeBusinessDataError(error)}`,
            'neutral',
          );
        },
      });
  }

  private loadQuote(stock: AverageMarketCapStock): void {
    this.quoteSubscription?.unsubscribe();
    this.quote = null;
    this.quoteError = null;
    this.isLoadingQuote = true;

    this.quoteSubscription = this.fundamentalDataProvider.getQuote(stock.symbol).subscribe({
      next: (quote) => {
        if (this.selectedStock?.symbol !== stock.symbol) {
          return;
        }

        this.quote = quote;
        this.isLoadingQuote = false;
      },
      error: (error: unknown) => {
        if (this.selectedStock?.symbol !== stock.symbol) {
          return;
        }

        this.quoteError = `FinEdge quote request failed: ${this.describeBusinessDataError(error)}`;
        this.isLoadingQuote = false;
      },
    });
  }

  private describeBusinessDataError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return `HTTP ${error.status || 'network error'}.`;
    }
    return error instanceof Error ? error.message : 'Unknown FinEdge API error.';
  }

  private setBusinessPoint(
    label:
      | 'Company'
      | 'Competitors and market position'
      | 'What does the company do?'
      | 'How does it make money?',
    value: string,
    detail: string,
    status: AnalysisStatus,
  ): void {
    this.analysisCategories = this.analysisCategories.map((category) =>
      category.title === '1. Business Understanding'
        ? {
            ...category,
            points: category.points.map((point) =>
              point.label === label
                ? { ...point, value, detail, status }
                : point,
            ),
          }
        : category,
    );
  }

  private applyShareholdingResult(result: ShareholdingPatternMetrics): void {
    const detail = `FinEdge quarterly shareholding pattern; ${result.latestQuarter} vs ${result.previousQuarter}.`;
    this.setShareholdingPosition('Promoter Holding', result.promoter, detail);
    this.setShareholdingPosition('FII Holding', result.fii, detail);
    this.setShareholdingPosition('DII Holding', result.dii, detail);
    this.setShareholdingPosition('Retail Holding', result.retail, detail, false);

    const direction =
      result.netInstitutionalChange > 0
        ? 'Institutions net buyers'
        : result.netInstitutionalChange < 0
          ? 'Institutions net sellers'
          : 'Institutions unchanged';
    const formattedNetChange = this.formatShareholdingNumber(result.netInstitutionalChange);
    const netChangeDetail =
      `FII and DII combined change from ${result.previousQuarter} to ${result.latestQuarter}: ` +
      `${result.netInstitutionalChange > 0 ? '+' : ''}${formattedNetChange} pp.`;
    this.setShareholdingPoint(
      'Quarter-on-Quarter Change',
      direction,
      netChangeDetail,
      result.netInstitutionalChange > 0
        ? 'positive'
        : result.netInstitutionalChange < 0
          ? 'negative'
          : 'neutral',
    );
  }

  private setShareholdingPosition(
    label: 'Promoter Holding' | 'FII Holding' | 'DII Holding' | 'Retail Holding',
    position: ShareholdingPosition,
    detail: string,
    useChangeStatus = true,
  ): void {
    const changeLabel =
      position.change === 0
        ? 'unchanged QoQ'
        : `${position.change > 0 ? '+' : ''}${this.formatShareholdingNumber(position.change)} pp QoQ`;
    this.setShareholdingPoint(
      label,
      `${this.formatShareholdingNumber(position.current)}% · ${changeLabel}`,
      detail,
      useChangeStatus && position.change !== 0
        ? position.change > 0
          ? 'positive'
          : 'negative'
        : 'neutral',
    );
  }

  private formatShareholdingNumber(value: number): string {
    return String(Number(value.toFixed(2)));
  }

  private setShareholdingPoint(
    label:
      | 'Promoter Holding'
      | 'FII Holding'
      | 'DII Holding'
      | 'Retail Holding'
      | 'Quarter-on-Quarter Change',
    value: string,
    detail: string,
    status: AnalysisStatus,
  ): void {
    this.analysisCategories = this.analysisCategories.map((category) =>
      category.title === '4. Shareholding Pattern'
        ? {
            ...category,
            points: category.points.map((point) =>
              point.label === label ? { ...point, value, detail, status } : point,
            ),
          }
        : category,
    );
  }

  private applyGrowthResult(
    label: 'Revenue growth' | 'Net profit growth',
    result: FinancialMetricCagr | null,
    metricName: string,
  ): void {
    if (!result) {
      this.setGrowthPoint(
        label,
        'Unavailable',
        `FinEdge did not return valid ${metricName} values spanning three full fiscal years.`,
        'neutral',
      );
      return;
    }

    this.setGrowthPoint(
      label,
      this.formatGrowthCagr(result),
      `FinEdge consolidated P&L ${metricName}, FY${result.startYear}–FY${result.endYear}.`,
      result.rate > 0 ? 'positive' : result.rate < 0 ? 'negative' : 'neutral',
    );
  }

  private applyProfitMarginResult(result: FinancialMetricMargin | null): void {
    if (!result) {
      this.setGrowthPoint(
        'Net Profit Margin (NPM)',
        'Unavailable',
        'FinEdge latest annual P&L is missing owners’ profit or a valid margin denominator.',
        'neutral',
      );
      return;
    }

    const denominatorLabel =
      result.denominatorField === 'interestEarned'
        ? 'owners’ profit ÷ interest earned (bank)'
        : 'owners’ profit ÷ revenue from operations';
    this.setGrowthPoint(
      'Net Profit Margin (NPM)',
      `${(result.rate * 100).toFixed(2)}%`,
      `FinEdge consolidated annual P&L FY${result.year}; ${denominatorLabel}.`,
      result.rate > 0 ? 'positive' : result.rate < 0 ? 'negative' : 'neutral',
    );
  }

  private applyOperatingMarginResult(result: FinancialMetricOperatingMargin | null): void {
    if (!result) {
      this.setGrowthPoint(
        'Operating Profit Margin (OPM / EBITDA)',
        'Unavailable',
        'FinEdge latest annual P&L is missing the fields needed to calculate operating margin.',
        'neutral',
      );
      return;
    }

    const formulaLabel = {
      bankPpop: '(income - expenditure excluding provisions) ÷ income (PPOP)',
      ebitda: 'EBITDA ÷ revenue from operations',
      operatingProfit: 'operating profit ÷ revenue from operations',
    }[result.formula];
    this.setGrowthPoint(
      'Operating Profit Margin (OPM / EBITDA)',
      `${(result.rate * 100).toFixed(2)}%`,
      `FinEdge consolidated annual P&L FY${result.year}; ${formulaLabel}.`,
      result.rate > 0 ? 'positive' : result.rate < 0 ? 'negative' : 'neutral',
    );
  }

  private applyEpsResult(result: FinancialMetricEps | null): void {
    if (!result) {
      this.setGrowthPoint(
        'EPS (Earnings Per Share)',
        'Unavailable',
        'FinEdge latest annual P&L is missing owners’ profit or diluted outstanding shares.',
        'neutral',
      );
      return;
    }

    const yoyValue =
      result.yoyRate === null
        ? ''
        : ` · ${result.yoyRate > 0 ? '+' : ''}${(result.yoyRate * 100).toFixed(1)}% YoY`;
    const yoyDetail =
      result.yoyRate === null ? '' : ` YoY compares FY${result.year} with FY${result.year - 1}.`;
    this.setGrowthPoint(
      'EPS (Earnings Per Share)',
      `₹${result.value.toFixed(2)}${yoyValue}`,
      `FinEdge consolidated annual P&L FY${result.year}; diluted EPS = owners’ profit ÷ diluted outstanding shares.${yoyDetail}`,
      result.value > 0 ? 'positive' : result.value < 0 ? 'negative' : 'neutral',
    );
  }

  private applyRoeResult(result: FinancialMetricRoe | null, error?: string): void {
    if (!result) {
      const detail = error
        ? `FinEdge balance-sheet request failed: ${error}`
        : 'FinEdge latest annual statements are missing valid parent profit or shareholders’ equity.';
      this.setGrowthPoint('ROE (Return on Equity)', 'Unavailable', detail, 'neutral');
      return;
    }

    this.setGrowthPoint(
      'ROE (Return on Equity)',
      `${(result.rate * 100).toFixed(2)}%`,
      `FinEdge consolidated statements FY${result.year}; parent profit ÷ shareholders’ equity.`,
      result.rate > 0 ? 'positive' : result.rate < 0 ? 'negative' : 'neutral',
    );
  }

  private applyRoceResult(result: FinancialMetricRoce | null, error?: string): void {
    if (result?.status === 'notApplicable') {
      this.setGrowthPoint(
        'ROCE (Return on Capital Employed)',
        'N/A (Use ROE / ROA)',
        `FinEdge consolidated P&L FY${result.year} identifies a bank by positive interest earned.`,
        'neutral',
      );
      return;
    }

    if (!result) {
      const detail = error
        ? `FinEdge balance-sheet request failed: ${error}`
        : 'FinEdge latest annual statements are missing valid EBIT or capital-employed values.';
      this.setGrowthPoint(
        'ROCE (Return on Capital Employed)',
        'Unavailable',
        detail,
        'neutral',
      );
      return;
    }

    const formulaLabel =
      result.capitalEmployedFormula === 'assetsLessCurrentLiabilities'
        ? 'EBIT ÷ (total assets - current liabilities)'
        : 'EBIT ÷ (capital + reserves + debt)';
    this.setGrowthPoint(
      'ROCE (Return on Capital Employed)',
      `${(result.rate * 100).toFixed(2)}%`,
      `FinEdge consolidated statements FY${result.year}; EBIT = profit before tax + finance costs; ${formulaLabel}.`,
      result.rate > 0 ? 'positive' : result.rate < 0 ? 'negative' : 'neutral',
    );
  }

  private applyRoaResult(result: FinancialMetricRoa | null, error?: string): void {
    if (!result) {
      const detail = error
        ? `FinEdge balance-sheet request failed: ${error}`
        : 'FinEdge latest annual statements are missing owners’ profit or total assets.';
      this.setGrowthPoint('ROA (Return on Assets)', 'Unavailable', detail, 'neutral');
      return;
    }

    this.setGrowthPoint(
      'ROA (Return on Assets)',
      `${(result.rate * 100).toFixed(2)}%`,
      `FinEdge consolidated statements FY${result.year}; owners’ profit ÷ total assets.`,
      result.rate > 0 ? 'positive' : result.rate < 0 ? 'negative' : 'neutral',
    );
  }

  private applyAnnualPriceRatiosResult(
    result: FinancialAnnualPriceRatios | null,
    error?: string,
  ): void {
    if (!result) {
      const detail = error
        ? `FinEdge annual price-ratios request failed: ${error}`
        : 'FinEdge annual price ratios did not contain usable valuation values.';
      this.setGrowthPoint('PE Ratio', 'Unavailable', detail, 'neutral');
      this.setGrowthPoint('PB Ratio (Price-to-Book)', 'Unavailable', detail, 'neutral');
      return;
    }

    const header = result.header ? `${result.header}, ` : '';
    const detail = `FinEdge standalone annual price ratios, ${header}FY${result.year}.`;
    this.setGrowthPoint(
      'PE Ratio',
      result.pe === null ? 'Unavailable' : `${this.formatMultiple(result.pe)}×`,
      result.pe === null ? `PE was not provided. ${detail}` : detail,
      'neutral',
    );
    this.setGrowthPoint(
      'PB Ratio (Price-to-Book)',
      result.pb === null ? 'Unavailable' : `${this.formatMultiple(result.pb)}×`,
      result.pb === null ? `PB was not provided. ${detail}` : detail,
      'neutral',
    );
  }

  private formatMultiple(value: number): string {
    return String(Number(value.toFixed(2)));
  }

  private formatGrowthCagr(result: FinancialMetricCagr): string {
    const percentage = (result.rate * 100).toFixed(2);
    const sign = result.rate > 0 ? '+' : '';
    return `${sign}${percentage}% ${result.years}Y CAGR`;
  }

  private setGrowthPoint(
    label:
      | 'Revenue growth'
      | 'Net profit growth'
      | 'Net Profit Margin (NPM)'
      | 'Operating Profit Margin (OPM / EBITDA)'
      | 'EPS (Earnings Per Share)'
      | 'ROE (Return on Equity)'
      | 'ROCE (Return on Capital Employed)'
      | 'ROA (Return on Assets)'
      | 'PE Ratio'
      | 'PB Ratio (Price-to-Book)',
    value: string,
    detail: string,
    status: AnalysisStatus,
  ): void {
    this.analysisCategories = this.analysisCategories.map((category) =>
      category.title === '2. Fundamental / Financial Health'
        ? {
            ...category,
            points: category.points.map((point) =>
              point.label === label ? { ...point, value, detail, status } : point,
            ),
          }
        : category,
    );
  }

  ngOnDestroy(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    this.financialGrowthSubscription?.unsubscribe();
    this.shareholdingSubscription?.unsubscribe();
    this.sectorPeersSubscription?.unsubscribe();
    this.companyProfileSubscription?.unsubscribe();
    this.segmentRevenueSubscription?.unsubscribe();
    this.quoteSubscription?.unsubscribe();
  }
}
