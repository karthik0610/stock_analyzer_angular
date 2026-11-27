import { Component, Input } from '@angular/core';
import { StockQuote } from '../../finedgeapi/quote';


@Component({
  selector: 'app-quote-snapshot',
  standalone: true,
  templateUrl: './quote-snapshot.component.html',
  styleUrl: './quote-snapshot.component.scss',
})
export class QuoteSnapshotComponent {
  @Input() companyName = '';
  @Input() quote: StockQuote | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  private readonly priceFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  private readonly integerFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });
  private readonly tradeTimeFormatter = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  get yearRangePosition(): number {
    return this.quote
      ? this.getRangePosition(this.quote.currentPrice, this.quote.low52, this.quote.high52)
      : 0;
  }

  get sessionRangePosition(): number {
    return this.quote
      ? this.getRangePosition(this.quote.currentPrice, this.quote.lowPrice, this.quote.highPrice)
      : 0;
  }

  formatPrice(value: number): string {
    return this.priceFormatter.format(value);
  }

  formatNumber(value: number): string {
    return this.integerFormatter.format(value);
  }

  formatMarketCap(value: number): string {
    return this.priceFormatter.format(value);
  }

  formatChange(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  formatTradeTime(value: string): string {
    return `${this.tradeTimeFormatter.format(new Date(value))} IST`;
  }

  private getRangePosition(value: number, low: number, high: number): number {
    if (high <= low) {
      return 50;
    }

    return Math.max(0, Math.min(100, ((value - low) / (high - low)) * 100));
  }
}
