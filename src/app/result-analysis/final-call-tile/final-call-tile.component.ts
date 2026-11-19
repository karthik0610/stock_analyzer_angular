import { Component, Input } from '@angular/core';
import {
  evaluateFinalCall,
  horizonDefinitions,
  investmentHorizonOrder,
  tradeSetupDefinitions,
  tradeSetupOrder,
  type InvestmentHorizon,
  type StockSymbol,
  type TradeSetupId,
} from './final-call-engine';
import { stockEvaluationSamples } from './final-call-sample-data';

@Component({
  selector: 'app-final-call-tile',
  standalone: true,
  templateUrl: './final-call-tile.component.html',
  styleUrl: './final-call-tile.component.scss',
})
export class FinalCallTileComponent {
  @Input({ required: true }) companyName = '';
  @Input({ required: true }) stockSymbol: StockSymbol = 'RELIANCE';

  readonly horizons = investmentHorizonOrder.map((id) => horizonDefinitions[id]);
  readonly setups = tradeSetupOrder.map((id) => tradeSetupDefinitions[id]);
  readonly summary = 'Illustrative demo scores and trade plan only — not live market data or personalized investment advice.';
  selectedHorizon: InvestmentHorizon = 'mediumTerm';
  selectedSetup: TradeSetupId = 'pullback';

  get selectedHorizonDetails() {
    return horizonDefinitions[this.selectedHorizon];
  }

  get evaluation() {
    return evaluateFinalCall(stockEvaluationSamples[this.stockSymbol], this.selectedHorizon, this.selectedSetup);
  }

  get selectedSetupDetails() {
    return tradeSetupDefinitions[this.selectedSetup];
  }

  selectHorizon(horizon: InvestmentHorizon): void {
    this.selectedHorizon = horizon;
  }

  selectSetup(setup: TradeSetupId): void {
    this.selectedSetup = setup;
  }
}
