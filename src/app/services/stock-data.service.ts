import { DestroyRef, Injectable, NgZone, afterNextRender, inject, signal } from '@angular/core';
import { largeCapStocks } from '../components/watchlist/large-cap-stocks';
import {
  MarketCandle,
} from './trading-rules/fvg-rule';
import {
  passesMandatoryRules,
  evaluateTradingRules,
  TradingRuleAnalysis,
  TradingRuleInputs,
} from './trading-rules/trading-rule-engine';
import {
  TRADING_RULE_DEFINITIONS,
  TradingRuleId,
} from './trading-rules/rule-registry';

export interface StockQuote {
  name: string;
  symbol: string;
  priceValue: number;
  changeValue: number;
  candles: MarketCandle[];
}

@Injectable({ providedIn: 'root' })
export class StockDataService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  readonly mockStreamActive = signal(false);
  readonly scannerRunning = signal(false);
  readonly hasScanned = signal(false);
  readonly scannedStocks = signal<StockQuote[]>([]);
  readonly ruleAnalyses = signal<Record<string, TradingRuleAnalysis>>({});
  readonly blockedByUnavailableCount = signal(0);
  readonly ruleInputsBySymbol = signal<Record<string, TradingRuleInputs>>({});
  readonly lastScanAt = signal<Date | null>(null);
  readonly enabledRules = signal<Record<TradingRuleId, boolean>>(
    Object.fromEntries(
      TRADING_RULE_DEFINITIONS.map((rule) => [rule.id, rule.enabledByDefault]),
    ) as Record<TradingRuleId, boolean>,
  );

  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private quoteStreamTimer: ReturnType<typeof setInterval> | null = null;

  readonly stocks = signal<StockQuote[]>(
    largeCapStocks.map((stock, index) => {
      const direction = index % 3 === 1 ? -1 : 1;
      const priceValue = 250 + ((index * 137.45) % 9_950);
      const changeValue = 0.45 + ((index * 17) % 475) / 100;

      return {
        ...stock,
        priceValue,
        changeValue: direction * changeValue,
        candles: this.createInitialMockCandles(priceValue, index),
      };
    }),
  );

  constructor() {
    afterNextRender(() => {
      this.mockStreamActive.set(true);
      this.zone.runOutsideAngular(() => {
        this.quoteStreamTimer = setInterval(() => this.emitMockQuotes(), 2_000);
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.quoteStreamTimer !== null) {
        clearInterval(this.quoteStreamTimer);
      }
    });
  }

  updateQuote(
    symbol: string,
    quote: Partial<Pick<StockQuote, 'priceValue' | 'changeValue' | 'candles'>>,
  ): void {
    this.stocks.update((stocks) =>
      stocks.map((stock) => {
        if (stock.symbol !== symbol) {
          return stock;
        }

        const updatedStock = { ...stock, ...quote };
        if (quote.candles || quote.priceValue === undefined || stock.candles.length === 0) {
          return updatedStock;
        }

        const candles = [...stock.candles];
        const lastIndex = candles.length - 1;
        const latest = candles[lastIndex];
        candles[lastIndex] = {
          ...latest,
          high: Math.max(latest.high, quote.priceValue),
          low: Math.min(latest.low, quote.priceValue),
          close: quote.priceValue,
        };

        return { ...updatedStock, candles };
      }),
    );

    if (this.scannerRunning()) {
      this.scan();
    }
  }

  updateRuleInputs(symbol: string, inputs: Partial<TradingRuleInputs>): void {
    this.ruleInputsBySymbol.update((current) => ({
      ...current,
      [symbol]: { ...current[symbol], ...inputs },
    }));
    if (this.scannerRunning() || this.hasScanned()) {
      this.scan();
    }
  }

  setRuleEnabled(id: TradingRuleId, enabled: boolean): void {
    const definition = TRADING_RULE_DEFINITIONS.find((rule) => rule.id === id);
    if (!definition?.toggleable) {
      return;
    }

    this.enabledRules.update((rules) => ({ ...rules, [id]: enabled }));
    if (this.scannerRunning() || this.hasScanned()) {
      this.scan();
    }
  }

  startScanner(): void {
    if (this.scannerRunning()) {
      return;
    }

    this.scannerRunning.set(true);
    this.scan();
    this.zone.runOutsideAngular(() => {
      this.scanTimer = setInterval(() => this.scan(), 2_000);
    });
  }

  stopScanner(): void {
    this.scannerRunning.set(false);
    if (this.scanTimer !== null) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  private scan(): void {
    const analyses: Record<string, TradingRuleAnalysis> = {};
    let blockedByUnavailable = 0;
    const ruleInputs = this.ruleInputsBySymbol();
    const enabled = this.enabledRules();
    const bullishStocks = this.stocks().filter((stock) => {
      const direction = stock.changeValue >= 0 ? 'bullish' : 'bearish';
      const inputs: TradingRuleInputs = {
        marketCapCategory: 'large',
        ...ruleInputs[stock.symbol],
      };
      const analysis = evaluateTradingRules(stock.candles, direction, inputs, enabled);
      analyses[stock.symbol] = analysis;
      if (stock.changeValue <= 0) {
        return false;
      }

      const missingMandatoryInput = Object.entries(analysis.results).some(([id, ruleResult]) => {
        const rule = TRADING_RULE_DEFINITIONS.find((definition) => definition.id === id);
        return !!rule &&
          enabled[rule.id] &&
          (rule.blocking || ruleResult.blocksCandidate === true) &&
          ruleResult.status === 'unavailable';
      });
      if (missingMandatoryInput) {
        blockedByUnavailable += 1;
      }
      return passesMandatoryRules(analysis, enabled);
    });

    this.ruleAnalyses.set(analyses);
    this.blockedByUnavailableCount.set(blockedByUnavailable);
    this.scannedStocks.set(
      bullishStocks.sort((left, right) => {
        const scoreDifference =
          (analyses[right.symbol]?.score ?? 0) - (analyses[left.symbol]?.score ?? 0);
        return scoreDifference || right.changeValue - left.changeValue;
      }),
    );
    this.hasScanned.set(true);
    this.lastScanAt.set(new Date());
  }

  private emitMockQuotes(): void {
    this.stocks.update((stocks) =>
      stocks.map((stock, index) => {
        const nextChange = Math.min(
          10,
          Math.max(-10, stock.changeValue + (Math.random() - 0.5) * 0.5),
        );
        const changeDelta = nextChange - stock.changeValue;
        const priceValue = Math.max(0.01, stock.priceValue * (1 + changeDelta / 100));

        return {
          ...stock,
          priceValue,
          changeValue: nextChange,
          candles: [
            ...stock.candles,
            this.createMockCandle(stock.candles, priceValue, index),
          ].slice(-180),
        };
      }),
    );

    if (this.scannerRunning()) {
      this.scan();
    }
  }

  private createInitialMockCandles(price: number, seed: number): MarketCandle[] {
    const count = 40;
    const now = Date.now();
    const candles: MarketCandle[] = [];
    let previousClose = price * 0.99;

    for (let index = 0; index < count; index += 1) {
      const wave =
        Math.sin((index + seed % 11) * 1.17) * 0.00035 +
        Math.cos((index + seed % 7) * 0.47) * 0.0002;
      const drift = (price - previousClose) / price / (count - index);
      const open = previousClose;
      const close = index === count - 1 ? price : open * (1 + wave + drift);
      const wick = price * (0.00015 + ((index * 13 + seed) % 8) / 100_000);
      const timestamp = now - (count - index) * 300_000;

      candles.push({
        index,
        timestamp,
        time: this.formatCandleTime(timestamp),
        open,
        high: Math.max(open, close) + wick,
        low: Math.min(open, close) - wick * 0.82,
        close,
        volume: 80 + ((index * 29 + seed) % 40),
      });
      previousClose = close;
    }

    const pattern = seed % 4;
    if (pattern === 0 || pattern === 1) {
      const unit = price * 0.001;
      const anchor = pattern === 0 ? price - 1.5 * unit : price + 1.5 * unit;
      const bearish = pattern === 1;
      const preZoneStart = count - 12;

      for (let index = preZoneStart; index < count - 4; index += 1) {
        const center = anchor + (index % 2 === 0 ? -0.02 : 0.02) * unit;
        candles[index] = {
          ...candles[index],
          open: center,
          close: center + (index % 2 === 0 ? 0.01 : -0.01) * unit,
          high: center + 0.08 * unit,
          low: center - 0.08 * unit,
          volume: 90,
        };
      }

      const orderBlockCandle: MarketCandle = {
        ...candles[count - 4],
        open: anchor + (bearish ? -0.1 : 0.1) * unit,
        close: anchor,
        high: anchor + (bearish ? 0 : 0.1) * unit,
        low: anchor - 0.2 * unit,
        volume: 95,
      };
      const first: MarketCandle = {
        ...candles[count - 3],
        open: anchor + (bearish ? -0.02 : 0.04) * unit,
        close: anchor + (bearish ? -0.08 : 0.08) * unit,
        high: anchor + (bearish ? -0.02 : 0.1) * unit,
        low: anchor + (bearish ? -0.1 : 0.02) * unit,
      };
      const middle: MarketCandle = {
        ...candles[count - 2],
        open: anchor + (bearish ? -0.12 : 0.12) * unit,
        close: anchor + (bearish ? -1.12 : 1.12) * unit,
        high: anchor + (bearish ? -0.02 : 1.22) * unit,
        low: anchor + (bearish ? -1.22 : 0.02) * unit,
        volume: 200,
      };
      const third: MarketCandle = {
        ...candles[count - 1],
        open: anchor + (bearish ? -1.25 : 1.25) * unit,
        high: bearish ? anchor - 1.23 * unit : price + 0.1 * unit,
        low: bearish ? price - 0.1 * unit : anchor + 1.23 * unit,
        close: price,
      };
      candles.splice(count - 4, 4, orderBlockCandle, first, middle, third);
    }

    return candles;
  }

  private createMockCandle(
    candles: readonly MarketCandle[],
    price: number,
    seed: number,
  ): MarketCandle {
    const previous = candles[candles.length - 1];
    const timestamp = Date.now();
    const wick = price * (0.0001 + ((candles.length * 17 + seed) % 5) / 100_000);

    return {
      index: previous.index + 1,
      timestamp,
      time: this.formatCandleTime(timestamp),
      open: previous.close,
      high: Math.max(previous.close, price) + wick,
      low: Math.min(previous.close, price) - wick,
      close: price,
      volume: 60 + ((candles.length * 19 + seed) % 100),
    };
  }

  private formatCandleTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
