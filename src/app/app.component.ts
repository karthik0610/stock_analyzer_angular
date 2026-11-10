import { Component } from '@angular/core';
import { FinalizedStocksComponent } from './components/finalized-stocks/finalized-stocks.component';
import { HeaderComponent } from './components/header/header.component';
import { StockAnalysisComponent } from './components/stock-analysis/stock-analysis.component';
import { TopStocksComponent } from './components/top-stocks/top-stocks.component';
import { TradingRulesComponent } from './components/trading-rules/trading-rules.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    WatchlistComponent,
    TopStocksComponent,
    TradingRulesComponent,
    FinalizedStocksComponent,
    StockAnalysisComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
}
