import { Component, OnDestroy } from '@angular/core';
import { AnalysisTileComponent } from '../analysis-tile/analysis-tile.component';
import { FinalCallTileComponent } from '../final-call-tile/final-call-tile.component';
import type { StockSymbol } from '../final-call-tile/final-call-engine';
import { getAnalysisCategoriesForStock, type AnalysisCategory } from '../analysis-categories';

interface StockResult {
  name: string;
  symbol: StockSymbol;
  result: string;
  change: string;
  positive: boolean;
}

interface DailyStockResults {
  label: string;
  stocks: StockResult[];
}

@Component({
  selector: 'app-result-analysis',
  standalone: true,
  imports: [AnalysisTileComponent, FinalCallTileComponent],
  templateUrl: './result-analysis.component.html',
  styleUrl: './result-analysis.component.scss',
})
export class ResultAnalysisComponent implements OnDestroy {
  readonly resultDays: DailyStockResults[] = [
    {
      label: 'Today',
      stocks: [
        { name: 'Reliance Industries', symbol: 'RELIANCE', result: '+₹2,450', change: '+1.86%', positive: true },
        { name: 'HDFC Bank', symbol: 'HDFCBANK', result: '-₹780', change: '-0.42%', positive: false },
      ],
    },
    {
      label: 'Yesterday',
      stocks: [
        { name: 'Infosys Ltd', symbol: 'INFY', result: '+₹1,320', change: '+0.78%', positive: true },
        { name: 'Tata Consultancy', symbol: 'TCS', result: '+₹965', change: '+0.54%', positive: true },
      ],
    },
    {
      label: '2 Days Ago',
      stocks: [
        { name: 'ICICI Bank', symbol: 'ICICIBANK', result: '-₹540', change: '-0.31%', positive: false },
        { name: 'Bharti Airtel', symbol: 'BHARTIARTL', result: '+₹1,105', change: '+0.67%', positive: true },
      ],
    },
  ];

  selectedStock: StockResult = this.resultDays[0].stocks[0];
  analysisCategories: AnalysisCategory[] = getAnalysisCategoriesForStock(this.selectedStock.symbol);
  isLoading = false;
  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;

  selectStock(stock: StockResult): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.selectedStock = stock;
    this.isLoading = true;
    this.loadingTimeout = setTimeout(() => {
      this.analysisCategories = getAnalysisCategoriesForStock(stock.symbol);
      this.isLoading = false;
      this.loadingTimeout = null;
    }, 700);
  }

  ngOnDestroy(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }
}
