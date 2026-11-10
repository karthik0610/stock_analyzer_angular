import { Injectable, signal } from '@angular/core';
import { largeCapStocks } from '../components/watchlist/large-cap-stocks';

export interface StockQuote {
  name: string;
  symbol: string;
  priceValue: number;
  changeValue: number;
}

@Injectable({ providedIn: 'root' })
export class StockDataService {
  readonly stocks = signal<StockQuote[]>(
    largeCapStocks.map((stock, index) => {
      const direction = index % 3 === 1 ? -1 : 1;
      const priceValue = 250 + ((index * 137.45) % 9_950);
      const changeValue = 0.45 + ((index * 17) % 475) / 100;

      return {
        ...stock,
        priceValue,
        changeValue: direction * changeValue,
      };
    }),
  );

  updateQuote(
    symbol: string,
    quote: Partial<Pick<StockQuote, 'priceValue' | 'changeValue'>>,
  ): void {
    this.stocks.update((stocks) =>
      stocks.map((stock) =>
        stock.symbol === symbol
          ? {
              ...stock,
              ...quote,
            }
          : stock,
      ),
    );
  }
}
