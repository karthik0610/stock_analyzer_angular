import { Component } from '@angular/core';

interface FinalizedStock {
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
  templateUrl: './finalized-stocks.component.html',
  styleUrl: './finalized-stocks.component.scss',
})
export class FinalizedStocksComponent {
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
}
