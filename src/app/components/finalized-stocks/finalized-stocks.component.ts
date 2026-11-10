import { Component } from '@angular/core';
import { StockChartComponent } from './stock-chart.component';

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
}

@Component({
  selector: 'app-finalized-stocks',
  standalone: true,
  imports: [StockChartComponent],
  templateUrl: './finalized-stocks.component.html',
  styleUrl: './finalized-stocks.component.scss',
})
export class FinalizedStocksComponent {
  selectedStock: FinalizedStock | null = null;
  previewStock: FinalizedStock | null = null;
  previewPosition = { left: '0px', top: '0px' };

  readonly stocks: FinalizedStock[] = [
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

  openChart(stock: FinalizedStock): void {
    this.previewStock = null;
    this.selectedStock = stock;
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
    this.selectedStock = null;
  }

  onCardKeydown(event: KeyboardEvent, stock: FinalizedStock): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openChart(stock);
    }
  }
}
