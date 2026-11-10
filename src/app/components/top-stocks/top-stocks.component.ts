import { Component } from '@angular/core';

interface StockMover {
  symbol: string;
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
  readonly bullishStocks: StockMover[] = [
    { symbol: 'RELIANCE', price: '1,308.00', change: '+1.30%' },
    { symbol: 'INFOSYS', price: '1,662.50', change: '+1.19%' },
    { symbol: 'TCS', price: '4,356.00', change: '+1.06%' },
    { symbol: 'HDFCBANK', price: '1,682.40', change: '+0.98%' },
    { symbol: 'LT', price: '3,712.50', change: '+0.95%' },
    { symbol: 'BHARTIARTL', price: '1,151.30', change: '+0.92%' },
    { symbol: 'SBIN', price: '842.75', change: '+0.87%' },
    { symbol: 'ICICIBANK', price: '1,251.60', change: '+0.85%' },
    { symbol: 'AXISBANK', price: '1,168.20', change: '+0.82%' },
    { symbol: 'ITC', price: '503.40', change: '+0.79%' },
    { symbol: 'MARUTI', price: '12,341.00', change: '+0.76%' },
    { symbol: 'M&M', price: '3,072.50', change: '+0.74%' },
    { symbol: 'BAJFINANCE', price: '7,301.00', change: '+0.68%' },
    { symbol: 'HCLTECH', price: '1,532.20', change: '+0.66%' },
    { symbol: 'COALINDIA', price: '492.10', change: '+0.63%' },
  ];

  readonly bearishStocks: StockMover[] = [
    { symbol: 'GLENMARK', price: '2,300.00', change: '-1.90%' },
    { symbol: 'SUNPHARMA', price: '1,726.40', change: '-1.84%' },
    { symbol: 'DRREDDY', price: '6,211.00', change: '-1.79%' },
    { symbol: 'BIOCON', price: '321.50', change: '-1.76%' },
    { symbol: 'CIPLA', price: '1,456.80', change: '-1.69%' },
    { symbol: 'DIVISLAB', price: '3,921.00', change: '-1.62%' },
    { symbol: 'LUPIN', price: '1,308.90', change: '-1.55%' },
    { symbol: 'PEL', price: '1,028.40', change: '-1.49%' },
    { symbol: 'ABBOTTINDIA', price: '29,645.00', change: '-1.46%' },
    { symbol: 'AUROPHARMA', price: '1,293.50', change: '-1.42%' },
    { symbol: 'ZYDUSLIFE', price: '1,004.50', change: '-1.38%' },
    { symbol: 'TORNTPHARM', price: '3,254.00', change: '-1.35%' },
    { symbol: 'NHPC', price: '103.20', change: '-1.31%' },
    { symbol: 'PFIZER', price: '4,982.00', change: '-1.28%' },
    { symbol: 'GRANULES', price: '569.80', change: '-1.24%' },
  ];
}
