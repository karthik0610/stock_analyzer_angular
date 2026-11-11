import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { StockDataService } from '../../services/stock-data.service';
import {
  TRADING_RULE_DEFINITIONS,
  TradingRuleId,
} from '../../services/trading-rules/rule-registry';

@Component({
  selector: 'app-trading-rules',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './trading-rules.component.html',
  styleUrl: './trading-rules.component.scss',
})
export class TradingRulesComponent {
  private readonly stockData = inject(StockDataService);
  readonly rules = computed(() => {
    const enabled = this.stockData.enabledRules();
    const analyses = Object.values(this.stockData.ruleAnalyses());
    return TRADING_RULE_DEFINITIONS.map((definition) => {
      const counts = analyses.reduce(
        (total, analysis) => {
          total[analysis.results[definition.id].status] += 1;
          return total;
        },
        { pass: 0, fail: 0, unavailable: 0, 'not-applicable': 0 },
      );
      const sampleReason = analyses
        .map((analysis) => analysis.results[definition.id])
        .find((ruleResult) => ruleResult.status === 'unavailable' || ruleResult.status === 'fail')
        ?.reason;
      return {
        ...definition,
        enabled: enabled[definition.id],
        statusSummary: analyses.length === 0
          ? 'Not scanned'
          : `${counts.pass} pass · ${counts.fail} fail · ${counts.unavailable} unavailable`,
        statusDetail: sampleReason ?? '',
      };
    });
  });

  get isRunning(): boolean {
    return this.stockData.scannerRunning();
  }

  get lastScanAt(): Date | null {
    return this.stockData.lastScanAt();
  }

  get scannedCount(): number {
    return this.stockData.scannedStocks().length;
  }

  get blockedCount(): number {
    return this.stockData.blockedByUnavailableCount();
  }

  get activeRuleCount(): number {
    return Object.values(this.stockData.enabledRules()).filter(Boolean).length;
  }

  toggleScanner(): void {
    if (this.isRunning) {
      this.stockData.stopScanner();
    } else {
      this.stockData.startScanner();
    }
  }

  toggleRule(id: TradingRuleId, event: Event): void {
    this.stockData.setRuleEnabled(id, (event.target as HTMLInputElement).checked);
  }
}
