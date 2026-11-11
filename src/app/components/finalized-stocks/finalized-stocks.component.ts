import { Component, computed, inject, signal } from '@angular/core';
import { StockChartComponent } from './stock-chart.component';
import { StockDataService, StockQuote } from '../../services/stock-data.service';
import {
  analyzeFairValueGaps,
  MarketCandle,
  FvgZone,
} from '../../services/trading-rules/fvg-rule';
import {
  analyzeOrderBlocks,
  OrderBlockZone,
} from '../../services/trading-rules/order-block-rule';

export interface FinalizedStock {
  name: string;
  symbol: string;
  price: string;
  change: string;
  score: number;
  support: string;
  resistance: string;
  entry: string;
  stopLoss: string;
  target1: string;
  target2: string;
  rewardRisk: string;
  rsi: string;
  movingAverage: string;
  volume: string;
  tags: string[];
  trend?: string;
  macd?: string;
  candles?: MarketCandle[];
  fvgZone?: FvgZone | null;
  obZone?: OrderBlockZone | null;
}

@Component({
  selector: 'app-finalized-stocks',
  standalone: true,
  imports: [StockChartComponent],
  templateUrl: './finalized-stocks.component.html',
  styleUrl: './finalized-stocks.component.scss',
})
export class FinalizedStocksComponent {
  private readonly stockData = inject(StockDataService);
  private readonly selectedFallback = signal<FinalizedStock | null>(null);
  private readonly selectedSymbol = signal<string | null>(null);
  readonly selectedStock = computed(() => {
    const symbol = this.selectedSymbol();
    if (!symbol) {
      return null;
    }

    const quote = this.stockData.stocks().find((stock) => stock.symbol === symbol);
    return quote && this.stockData.hasScanned()
      ? this.toFinalizedStock(quote)
      : this.selectedFallback();
  });
  previewStock: FinalizedStock | null = null;
  previewPosition = { left: '0px', top: '0px' };

  readonly initialStocks: FinalizedStock[] = [
    {
      name: 'Reliance Industries Ltd', symbol: 'RELIANCE', price: '₹1,308.00', change: '+1.30% (+16.80)', score: 92,
      support: '₹1,285.00', resistance: '₹1,340.00', entry: '₹1,300.00', stopLoss: '₹1,270.00',
      target1: '₹1,330.00', target2: '₹1,340.00', rewardRisk: '1 : 2.0', rsi: '62.5',
      movingAverage: '₹1,245.00', volume: '1.8× Avg', tags: ['BOS ✓', 'FVG ✓', 'OB ✓', 'Above 200 SMA ✓'],
    },
    {
      name: 'Infosys Ltd', symbol: 'INFOSYS', price: '₹1,662.50', change: '+1.19% (+19.60)', score: 89,
      support: '₹1,635.00', resistance: '₹1,685.00', entry: '₹1,650.00', stopLoss: '₹1,620.00',
      target1: '₹1,670.00', target2: '₹1,685.00', rewardRisk: '1 : 2.1', rsi: '58.7',
      movingAverage: '₹1,604.00', volume: '1.6× Avg', tags: ['BOS ✓', 'FVG ✓', 'Above 200 SMA ✓'],
    },
    {
      name: 'TCS Ltd', symbol: 'TCS', price: '₹4,356.00', change: '+1.06% (+45.70)', score: 87,
      support: '₹4,310.00', resistance: '₹4,410.00', entry: '₹4,335.00', stopLoss: '₹4,290.00',
      target1: '₹4,380.00', target2: '₹4,410.00', rewardRisk: '1 : 2.0', rsi: '61.2',
      movingAverage: '₹4,218.00', volume: '1.7× Avg', tags: ['BOS ✓', 'OB ✓', 'Above 200 SMA ✓'],
    },
    {
      name: 'HDFC Bank Ltd', symbol: 'HDFCBANK', price: '₹1,682.40', change: '+0.98% (+16.20)', score: 85,
      support: '₹1,650.00', resistance: '₹1,720.00', entry: '₹1,675.00', stopLoss: '₹1,640.00',
      target1: '₹1,710.00', target2: '₹1,720.00', rewardRisk: '1 : 2.0', rsi: '56.4',
      movingAverage: '₹1,608.00', volume: '1.5× Avg', tags: ['BOS ✓', 'FVG ✓', 'Above 200 SMA ✓'],
    },
  ];

  readonly stocks = computed(() => {
    if (!this.stockData.hasScanned()) {
      return this.initialStocks;
    }

    return this.stockData.scannedStocks().map((quote) => this.toFinalizedStock(quote));
  });

  openChart(stock: FinalizedStock): void {
    this.previewStock = null;
    this.selectedFallback.set(stock);
    this.selectedSymbol.set(stock.symbol);
  }

  showPreview(event: PointerEvent | FocusEvent, stock: FinalizedStock): void {
    if ('pointerType' in event && event.pointerType === 'touch') {
      return;
    }

    const card = event.currentTarget as HTMLElement;
    const bounds = card.getBoundingClientRect();
    const width = Math.min(560, window.innerWidth - 32);
    const height = 330;
    const openRight = bounds.right + width <= window.innerWidth - 16;
    const maxLeft = Math.max(16, window.innerWidth - width - 16);
    const left = openRight
      ? bounds.right - 2
      : Math.min(Math.max(16, bounds.right - width + 2), maxLeft);
    const top = Math.min(
      Math.max(bounds.top, 16),
      Math.max(16, window.innerHeight - height - 16),
    );

    this.previewPosition = { left: `${left}px`, top: `${top}px` };
    this.previewStock = stock;
  }

  onCardPointerLeave(event: PointerEvent | FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Element && nextTarget.closest('.chart-preview')) {
      return;
    }

    this.previewStock = null;
  }

  onPreviewPointerLeave(event: PointerEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Element && nextTarget.closest('.stock-card')) {
      return;
    }

    this.previewStock = null;
  }

  closeChart(): void {
    this.selectedSymbol.set(null);
    this.selectedFallback.set(null);
  }

  onCardKeydown(event: KeyboardEvent, stock: FinalizedStock): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openChart(stock);
    }
  }

  private toFinalizedStock(quote: StockQuote): FinalizedStock {
    const price = quote.priceValue;
    const priceChange = price * quote.changeValue / 100;
    const analysis = this.stockData.ruleAnalyses()[quote.symbol];
    const inputs = this.stockData.ruleInputsBySymbol()[quote.symbol];
    const fvgAnalysis = analyzeFairValueGaps(quote.candles);
    const fvgZone = fvgAnalysis.latestQualifiedBullish ?? fvgAnalysis.latestBullish;
    const obAnalysis = analyzeOrderBlocks(quote.candles);
    const obZone = obAnalysis.latestQualifiedBullish ?? obAnalysis.latestBullish;
    const formatPrice = (value: number): string =>
      `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatLevel = (value: number | undefined): string =>
      value === undefined ? 'Unavailable' : formatPrice(value);
    const changeSign = quote.changeValue >= 0 ? '+' : '';
    const resultFor = (id: 'R004' | 'R005' | 'R006' | 'R007' | 'R008' | 'R010' | 'R020') =>
      analysis?.results[id];
    const statusTag = (id: 'R010' | 'R020'): string => {
      const rule = resultFor(id);
      return `${id} ${rule?.status ?? 'unavailable'}`;
    };
    const sizedEntry = analysis?.results.R021.metrics?.['entry'];
    const sizedStop = analysis?.results.R021.metrics?.['stopLoss'];
    const riskRewardStop = analysis?.results.R015.metrics?.['stopLoss'];
    const plannedEntry = typeof sizedEntry === 'number'
      ? sizedEntry
      : inputs?.entry;
    const plannedStop = typeof sizedStop === 'number'
      ? sizedStop
      : typeof riskRewardStop === 'number'
        ? riskRewardStop
        : inputs?.stopLoss;
    const risk = plannedEntry !== undefined && plannedStop !== undefined
      ? Math.abs(plannedEntry - plannedStop)
      : undefined;
    const targets = risk === undefined
      ? []
      : [1.5, 2].map((multiple) =>
        plannedEntry !== undefined
          ? plannedEntry + (analysis?.direction === 'bearish' ? -1 : 1) * risk * multiple
          : undefined,
      );
    const support = analysis?.results.R013.metrics?.['support'];
    const resistance = analysis?.results.R013.metrics?.['resistance'];
    const supportValue = typeof support === 'number' ? support : undefined;
    const resistanceValue = typeof resistance === 'number' ? resistance : undefined;
    const rsi = resultFor('R007')?.value;
    const emaSeparation = resultFor('R005')?.value;
    const relativeVolume = resultFor('R006')?.value;

    return {
      name: quote.name,
      symbol: quote.symbol,
      price: formatPrice(price),
      change: `${changeSign}${quote.changeValue.toFixed(2)}% (${changeSign}${formatLevel(priceChange)})`,
      score: analysis?.score ?? 0,
      support: formatLevel(supportValue),
      resistance: formatLevel(resistanceValue),
      entry: formatLevel(plannedEntry),
      stopLoss: formatLevel(plannedStop),
      target1: formatLevel(targets[0]),
      target2: formatLevel(targets[1]),
      rewardRisk: typeof analysis?.results.R015.value === 'number'
        ? `1 : ${analysis.results.R015.value.toFixed(2)}`
        : 'Unavailable',
      rsi: typeof rsi === 'number' ? rsi.toFixed(1) : 'Unavailable',
      movingAverage: typeof emaSeparation === 'number'
        ? `${emaSeparation.toFixed(2)}%`
        : 'Unavailable',
      volume: typeof relativeVolume === 'number'
        ? `${relativeVolume.toFixed(2)}× RVOL`
        : 'Unavailable',
      trend: resultFor('R004')?.status === 'pass' && resultFor('R005')?.status === 'pass'
        ? 'Aligned'
        : 'Not confirmed',
      macd: resultFor('R008')?.status === 'pass' ? 'Aligned' : 'Not confirmed',
      tags: [
        `Score ${analysis?.score ?? 0}/100 · ${analysis?.classification ?? 'not scored'}`,
        statusTag('R010'),
        statusTag('R020'),
        fvgZone
          ? `Bullish FVG · ${fvgZone.status} · ${fvgZone.gapAtrRatio.toFixed(2)} ATR`
          : 'Bullish FVG · not found',
        obZone
          ? `Bullish OB · ${obZone.status} · ${obZone.displacementAtrRatio.toFixed(2)} ATR`
          : 'Bullish OB · not found',
      ],
      candles: quote.candles,
      fvgZone,
      obZone,
    };
  }
}
