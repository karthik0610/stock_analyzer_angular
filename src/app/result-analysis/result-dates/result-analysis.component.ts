import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import type { Subscription } from 'rxjs';
import { AnalysisTileComponent } from '../analysis-tile/analysis-tile.component';
import { FinalCallTileComponent } from '../final-call-tile/final-call-tile.component';
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
  FinancialGrowthCagrs,
  FinancialMetricCagr,
  FinancialMetricMargin,
} from '../../finedgeapi/revenue-growth';

@Component({
  selector: 'app-result-analysis',
  standalone: true,
  imports: [AnalysisTileComponent, FinalCallTileComponent],
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
  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;
  private financialGrowthSubscription: Subscription | null = null;

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
    this.loadFinancialGrowth(stock);
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
      this.loadFinancialGrowth(this.selectedStock);
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
        },
      });
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

  private formatGrowthCagr(result: FinancialMetricCagr): string {
    const percentage = (result.rate * 100).toFixed(2);
    const sign = result.rate > 0 ? '+' : '';
    return `${sign}${percentage}% ${result.years}Y CAGR`;
  }

  private setGrowthPoint(
    label: 'Revenue growth' | 'Net profit growth' | 'Net Profit Margin (NPM)',
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
  }
}
