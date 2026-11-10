import { Component } from '@angular/core';

interface TradingRule {
  name: string;
  detail: string;
  enabled: boolean;
}

@Component({
  selector: 'app-trading-rules',
  standalone: true,
  templateUrl: './trading-rules.component.html',
  styleUrl: './trading-rules.component.scss',
})
export class TradingRulesComponent {
  hasRun = false;

  readonly rules: TradingRule[] = [
    { name: 'Market & Liquidity Filter', detail: '(Avg. Vol, Market Cap)', enabled: true },
    { name: 'Above 200 SMA', detail: '(Long-term Trend)', enabled: true },
    { name: 'RSI Momentum', detail: '(40 – 70)', enabled: true },
    { name: 'Volume Surge', detail: '(≥ 1.5× Avg. Volume)', enabled: true },
    { name: 'FVG (Fair Value Gap)', detail: '', enabled: true },
    { name: 'Order Block', detail: '(Demand / Supply Zone)', enabled: true },
    { name: 'BOS / CHOCH', detail: '(Trend Change)', enabled: true },
    { name: 'Near Support', detail: '(≤ 2% from Support)', enabled: false },
    { name: 'Resistance Breakout', detail: '(Resistance + Vol)', enabled: true },
    { name: 'Risk / Reward Filter', detail: '(≥ 1 : 2)', enabled: true },
  ];

  runScanner(): void {
    this.hasRun = true;
  }
}
