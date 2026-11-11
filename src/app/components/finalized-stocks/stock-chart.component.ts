import { Component, computed, input, signal } from '@angular/core';
import { FvgZone, MarketCandle } from '../../services/trading-rules/fvg-rule';
import { OrderBlockZone } from '../../services/trading-rules/order-block-rule';

export interface ChartStock {
  name: string;
  symbol: string;
  price: string;
  support: string;
  entry: string;
  stopLoss: string;
  target1: string;
  target2: string;
  candles?: MarketCandle[];
  fvgZone?: FvgZone | null;
  obZone?: OrderBlockZone | null;
}

type Timeframe = '1m' | '5m' | '15m';
type Marking = 'ob' | 'fvg' | 'entry' | 'stopLoss' | 'targets';

interface RenderedCandle extends MarketCandle {
  x: number;
  openY: number;
  highY: number;
  lowY: number;
  closeY: number;
  bodyY: number;
  bodyHeight: number;
  bullish: boolean;
}

const CHART_WIDTH = 800;
const PLOT_LEFT = 42;
const PLOT_RIGHT = 748;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 258;
const VOLUME_TOP = 274;
const VOLUME_BOTTOM = 312;
const CANDLE_COUNT = 90;

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  templateUrl: './stock-chart.component.html',
  styleUrl: './stock-chart.component.scss',
})
export class StockChartComponent {
  readonly stock = input.required<ChartStock>();
  readonly compact = input(false);
  readonly Math = Math;
  readonly PLOT_LEFT = PLOT_LEFT;
  readonly PLOT_RIGHT = PLOT_RIGHT;
  readonly PLOT_TOP = PLOT_TOP;
  readonly VOLUME_BOTTOM = VOLUME_BOTTOM;
  readonly timeframe = signal<Timeframe>('5m');
  readonly candleWindow = signal(36);
  readonly endIndex = signal(CANDLE_COUNT);
  readonly inspectedIndex = signal<number | null>(null);
  readonly cursorX = signal<number | null>(null);
  readonly obVisible = signal(true);
  readonly fvgVisible = signal(true);
  readonly entryVisible = signal(true);
  readonly stopVisible = signal(true);
  readonly targetsVisible = signal(true);

  private dragState: { pointerId: number; lastX: number } | null = null;

  readonly currentPrice = computed(() => this.parsePrice(this.stock().price));
  readonly chartCandles = computed(() => {
    const stockCandles = this.stock().candles;
    if (this.timeframe() === '5m' && stockCandles?.length) {
      return stockCandles;
    }

    return this.generateCandles(
      this.stock().symbol,
      this.currentPrice(),
      this.compact() ? '5m' : this.timeframe(),
    );
  });
  readonly currentFvgZone = computed(() => this.stock().fvgZone ?? null);
  readonly currentObZone = computed(() => this.stock().obZone ?? null);
  readonly visibleCandles = computed(() => {
    const candles = this.chartCandles();
    const count = this.compact() ? 5 : this.candleWindow();
    const end = this.compact()
      ? candles.length
      : Math.min(candles.length, Math.max(count, this.endIndex()));

    return candles.slice(Math.max(0, end - count), end);
  });
  readonly priceDomain = computed(() => {
    const prices = this.visibleCandles().flatMap((candle) => [candle.low, candle.high]);
    prices.push(
      this.currentPrice(),
      this.parsePrice(this.stock().stopLoss),
      this.parsePrice(this.stock().entry),
      this.parsePrice(this.stock().target1),
      this.parsePrice(this.stock().target2),
      this.parsePrice(this.stock().support),
    );
    const fvgZone = this.currentFvgZone();
    if (fvgZone) {
      prices.push(fvgZone.lower, fvgZone.upper);
    }
    const obZone = this.currentObZone();
    if (obZone) {
      prices.push(obZone.lower, obZone.upper);
    }
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const padding = Math.max((high - low) * 0.08, this.currentPrice() * 0.001);

    return { min: low - padding, max: high + padding };
  });
  readonly renderedCandles = computed<RenderedCandle[]>(() => {
    const candles = this.visibleCandles();
    const slot = this.slotWidth();

    return candles.map((candle, index) => {
      const openY = this.priceY(candle.open);
      const closeY = this.priceY(candle.close);

      return {
        ...candle,
        x: PLOT_LEFT + slot * (index + 0.5),
        openY,
        highY: this.priceY(candle.high),
        lowY: this.priceY(candle.low),
        closeY,
        bodyY: Math.min(openY, closeY),
        bodyHeight: Math.max(1.5, Math.abs(openY - closeY)),
        bullish: candle.close >= candle.open,
      };
    });
  });
  readonly inspectedCandle = computed(
    () =>
      this.visibleCandles().find(
        (candle) => candle.index === this.inspectedIndex(),
      ) ?? null,
  );
  readonly crosshairX = computed(() => {
    const index = this.visibleCandles().findIndex(
      (candle) => candle.index === this.inspectedIndex(),
    );

    return index < 0
      ? null
      : PLOT_LEFT + this.slotWidth() * (index + 0.5);
  });
  readonly priceLines = computed(() => [
    { key: 'entry' as const, label: 'ENTRY', value: this.parsePrice(this.stock().entry), color: '#32dc91', visible: this.entryVisible() },
    { key: 'stopLoss' as const, label: 'STOP', value: this.parsePrice(this.stock().stopLoss), color: '#ff6575', visible: this.stopVisible() },
    { key: 'target1' as const, label: 'TARGET 1', value: this.parsePrice(this.stock().target1), color: '#45b9ff', visible: this.targetsVisible() },
    { key: 'target2' as const, label: 'TARGET 2', value: this.parsePrice(this.stock().target2), color: '#65aaff', visible: this.targetsVisible() },
    { key: 'current' as const, label: 'CURRENT', value: this.currentPrice(), color: '#f5ca62', visible: true },
  ]);
  readonly tickValues = computed(() => {
    const domain = this.priceDomain();

    return Array.from({ length: 5 }, (_, index) =>
      domain.max - ((domain.max - domain.min) * index) / 4,
    );
  });
  readonly volumeMax = computed(() =>
    Math.max(...this.visibleCandles().map((candle) => candle.volume), 1),
  );

  setTimeframe(timeframe: Timeframe): void {
    this.timeframe.set(timeframe);
    this.endIndex.set(this.chartCandles().length);
    this.candleWindow.set(36);
    this.clearInspection();
  }

  toggleMarking(marking: Marking): void {
    const visibility = {
      ob: this.obVisible,
      fvg: this.fvgVisible,
      entry: this.entryVisible,
      stopLoss: this.stopVisible,
      targets: this.targetsVisible,
    }[marking];
    visibility.update((visible) => !visible);
  }

  onWheel(event: WheelEvent): void {
    if (this.compact()) {
      return;
    }

    event.preventDefault();
    const current = this.candleWindow();
    const next = Math.min(this.chartCandles().length, Math.max(10, current + (event.deltaY > 0 ? 6 : -6)));
    this.candleWindow.set(next);
    this.endIndex.set(Math.min(this.chartCandles().length, Math.max(next, this.endIndex())));
  }

  onPointerDown(event: PointerEvent): void {
    if (this.compact() || event.button !== 0) {
      return;
    }

    const svg = event.currentTarget as SVGSVGElement;
    svg.setPointerCapture(event.pointerId);
    this.dragState = { pointerId: event.pointerId, lastX: event.clientX };
    event.preventDefault();
  }

  onPointerMove(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const bounds = svg.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;

    if (this.dragState?.pointerId === event.pointerId) {
      const deltaX = event.clientX - this.dragState.lastX;
      const pixelsPerCandle =
        (bounds.width * (PLOT_RIGHT - PLOT_LEFT)) /
        CHART_WIDTH /
        this.visibleCandles().length;
      const steps = Math.trunc(deltaX / Math.max(pixelsPerCandle, 1));

      if (steps !== 0) {
        const nextEnd = Math.min(
          this.chartCandles().length,
          Math.max(this.candleWindow(), this.endIndex() - steps),
        );
        this.endIndex.set(nextEnd);
        this.dragState.lastX +=
          steps * pixelsPerCandle;
      }
      return;
    }

    this.cursorX.set(x);
    const candleIndex = Math.floor(
      ((x - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)) *
        this.visibleCandles().length,
    );
    const candle = this.visibleCandles()[candleIndex];
    this.inspectedIndex.set(
      x >= PLOT_LEFT && x <= PLOT_RIGHT ? candle?.index ?? null : null,
    );
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragState?.pointerId === event.pointerId) {
      const svg = event.currentTarget as SVGSVGElement;
      if (svg.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
      }
      this.dragState = null;
    }
  }

  clearInspection(): void {
    this.inspectedIndex.set(null);
    this.cursorX.set(null);
  }

  slotWidth(): number {
    return (PLOT_RIGHT - PLOT_LEFT) / Math.max(this.visibleCandles().length, 1);
  }

  priceY(price: number): number {
    const domain = this.priceDomain();
    return (
      PLOT_TOP +
      ((domain.max - price) / (domain.max - domain.min)) *
        (PLOT_BOTTOM - PLOT_TOP)
    );
  }

  volumeHeight(volume: number): number {
    return (volume / this.volumeMax()) * (VOLUME_BOTTOM - VOLUME_TOP);
  }

  tickStep(): number {
    return Math.max(1, Math.ceil(this.renderedCandles().length / 5));
  }

  formatPrice(price: number): string {
    return `₹${price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  get zoneX(): number {
    return PLOT_LEFT + (PLOT_RIGHT - PLOT_LEFT) * 0.52;
  }

  get zoneWidth(): number {
    return PLOT_RIGHT - this.zoneX;
  }

  private parsePrice(price: string): number {
    return Number(price.replace(/[^\d.-]/g, '')) || 0;
  }

  private generateCandles(symbol: string, currentPrice: number, timeframe: Timeframe): MarketCandle[] {
    const seed = [...symbol].reduce(
      (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
      7,
    );
    const interval = Number.parseInt(timeframe, 10);
    const startPrice = currentPrice * (1 - 0.015 - (seed % 18) / 1000);
    let previousClose = startPrice;

    return Array.from({ length: CANDLE_COUNT }, (_, index) => {
      const wave =
        Math.sin((index + seed % 11) * 1.17) * 0.0018 +
        Math.cos((index + seed % 7) * 0.47) * 0.0012;
      const drift = (currentPrice - startPrice) / CANDLE_COUNT / currentPrice;
      const open = previousClose;
      let close = open * (1 + wave + drift);
      if (index === CANDLE_COUNT - 1) {
        close = currentPrice;
      }

      const wick = currentPrice * (0.001 + ((index * 13 + seed) % 8) / 10_000);
      const high = Math.max(open, close) + wick;
      const low = Math.min(open, close) - wick * 0.82;
      const totalMinutes = 9 * 60 + 15 + index * interval;
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      previousClose = close;

      return {
        index,
        timestamp: index,
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        open,
        high,
        low,
        close,
        volume: 35 + ((index * 29 + seed) % 90),
      };
    });
  }
}
