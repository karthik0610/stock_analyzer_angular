import { Component } from '@angular/core';
import { FinalizedStocksComponent } from './components/finalized-stocks/finalized-stocks.component';
import { HeaderComponent, type ScreenOption } from './components/header/header.component';

import { StockAnalysisComponent } from './components/stock-analysis/stock-analysis.component';
import { TopStocksComponent } from './components/top-stocks/top-stocks.component';
import { TradingRulesComponent } from './components/trading-rules/trading-rules.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { ResultAnalysisComponent } from './result-analysis/result-dates/result-analysis.component';
import { FundamentalAnalysisComponent } from './finedgeapi/fundamental-analysis.component';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    ResultAnalysisComponent,
    WatchlistComponent,
    TopStocksComponent,
    TradingRulesComponent,
    FinalizedStocksComponent,
    StockAnalysisComponent,
    FundamentalAnalysisComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  activeScreen: ScreenOption = 'auto-trade';
}
