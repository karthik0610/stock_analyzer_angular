import { Component, Input } from '@angular/core';
import type { AnalysisPoint } from '../analysis-categories';

@Component({
  selector: 'app-analysis-tile',
  standalone: true,
  templateUrl: './analysis-tile.component.html',
  styleUrl: './analysis-tile.component.scss',
})
export class AnalysisTileComponent {
  @Input({ required: true }) title = '';
  @Input() companyName = '';
  @Input() summary = '';
  @Input({ required: true }) points: AnalysisPoint[] = [];
  @Input() warnings: AnalysisPoint[] = [];
}
