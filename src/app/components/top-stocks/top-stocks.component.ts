import { Component, computed, inject } from '@angular/core';
import { StockDataService, StockQuote } from '../../services/stock-data.service';

interface StockMover extends StockQuote {
  price: string;
  change: string;
}

@Component({
  selector: 'app-top-stocks',
  standalone: true,
  templateUrl: './top-stocks.component.html',
  styleUrl: './top-stocks.component.scss',
})
export class TopStocksComponent {
  private readonly stockData = inject(StockDataService);

  readonly bullishStocks = computed(() =>
    this.stockData.stocks()
      .filter((stock) => stock.changeValue > 0)
      .sort((a, b) => b.changeValue - a.changeValue)
      .slice(0, 15)
      .map((stock) => this.toMover(stock)),
  );

  readonly bearishStocks = computed(() =>
    this.stockData.stocks()
      .filter((stock) => stock.changeValue < 0)
      .sort((a, b) => a.changeValue - b.changeValue)
      .slice(0, 15)
      .map((stock) => this.toMover(stock)),
  );

  private toMover(stock: StockQuote): StockMover {
    return {
      ...stock,
      price: stock.priceValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      change: `${stock.changeValue > 0 ? '+' : ''}${stock.changeValue.toFixed(2)}%`,
    };
  }
}
