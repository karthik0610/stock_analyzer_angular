import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import {
  FINEDGE_API_TOKEN,
  FUNDAMENTAL_PERIODS,
} from './finedgeapi.constants';
import type { FundamentalPeriod } from './finedgeapi.constants';
import {
  FUNDAMENTAL_DATA_PROVIDER,
  type CompanySymbol,
  type FundamentalDataSection,
} from './fundamental-data-provider';

interface FundamentalTable {
  columns: string[];
  rows: unknown[][];
}

@Component({
  selector: 'app-fundamental-analysis',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './fundamental-analysis.component.html',
  styleUrl: './fundamental-analysis.component.scss',
})
export class FundamentalAnalysisComponent implements OnInit {
  private readonly provider = inject(FUNDAMENTAL_DATA_PROVIDER);

  readonly periods = FUNDAMENTAL_PERIODS;
  readonly providerName = this.provider.providerName;
  readonly apiKeyConfigured =
    FINEDGE_API_TOKEN.trim().length > 0 && !FINEDGE_API_TOKEN.startsWith('YOUR_');
  symbols: CompanySymbol[] = [];
  selectedSymbol = '';
  selectedPeriod: FundamentalPeriod = 'annual';
  statementType: 's' | 'c' = 's';
  sections: FundamentalDataSection[] = [];
  loadingSymbols = false;
  loadingAnalysis = false;
  symbolLoadError = '';
  requestError = '';

  get filteredSymbols(): CompanySymbol[] {
    const query = this.selectedSymbol.trim().toLowerCase();
    return (query
      ? this.symbols.filter((company) =>
          `${company.symbol} ${company.name}`.toLowerCase().includes(query),
        )
      : this.symbols
    ).slice(0, 100);
  }

  ngOnInit(): void {
    if (!this.apiKeyConfigured) {
      return;
    }

    this.loadingSymbols = true;
    this.provider
      .getSymbols()
      .pipe(
        catchError((error: unknown) => {
          this.symbolLoadError =
            error instanceof Error ? error.message : 'Could not load FinEdge stock symbols.';
          return of([]);
        }),
      )
      .subscribe((symbols) => {
        this.symbols = symbols;
        this.loadingSymbols = false;
      });
  }

  loadFundamentals(event: Event): void {
    event.preventDefault();
    const symbol = this.selectedSymbol.trim().toUpperCase();
    if (!symbol || !this.apiKeyConfigured || this.loadingAnalysis) {
      return;
    }

    this.selectedSymbol = symbol;
    this.sections = [];
    this.requestError = '';
    this.loadingAnalysis = true;
    this.provider
      .getFundamentals(symbol, {
        period: this.selectedPeriod,
        statementType: this.statementType,
      })
      .subscribe({
        next: (sections) => {
          this.sections = sections;
          this.loadingAnalysis = false;
        },
        error: (error: unknown) => {
          this.requestError =
            error instanceof Error ? error.message : 'Could not load fundamental data.';
          this.loadingAnalysis = false;
        },
      });
  }

  tableFor(data: unknown): FundamentalTable {
    const records = this.findRecords(data);
    if (records) {
      const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];
      return { columns, rows: records.map((record) => columns.map((column) => record[column])) };
    }

    if (Array.isArray(data)) {
      return { columns: ['Value'], rows: data.map((value) => [value]) };
    }

    if (this.isRecord(data)) {
      const entries = Object.entries(data);
      return {
        columns: ['Metric', 'Value'],
        rows: entries.map(([key, value]) => [key, value]),
      };
    }

    return { columns: ['Value'], rows: [[data]] };
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private findRecords(value: unknown): Record<string, unknown>[] | null {
    if (Array.isArray(value)) {
      const records = value.filter((item): item is Record<string, unknown> => this.isRecord(item));
      return records.length > 0 ? records : null;
    }

    if (!this.isRecord(value)) {
      return null;
    }

    const preferredKeys = ['data', 'results', 'financials', 'ratios', 'metrics', 'records'];
    for (const key of preferredKeys) {
      if (key in value) {
        const found = this.findRecords(value[key]);
        if (found) {
          return found;
        }
      }
    }

    for (const nested of Object.values(value)) {
      const found = this.findRecords(nested);
      if (found) {
        return found;
      }
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
