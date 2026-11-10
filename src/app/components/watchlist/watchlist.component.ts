import { Component } from '@angular/core';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
})
export class WatchlistComponent {
  readonly stocks = [
    { name: 'Reliance Industries Ltd', symbol: 'RELIANCE', price: '1,308.00', change: '+1.30%', positive: true },
    { name: 'GLENMARK', symbol: 'GLENMARK', price: '2,300.00', change: '-1.90%', positive: false },
  ];
}
