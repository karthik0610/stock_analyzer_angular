import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ScreenOption = 'auto-trade' | 'result-analysis' | 'finedge-fundamentals';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() activeScreen: ScreenOption = 'auto-trade';
  @Output() activeScreenChange = new EventEmitter<ScreenOption>();

  onScreenChange(event: Event): void {
    const target = event.target;
    if (
      target instanceof HTMLSelectElement &&
      (target.value === 'auto-trade' ||
        target.value === 'result-analysis' ||
        target.value === 'finedge-fundamentals')
    ) {
      this.activeScreenChange.emit(target.value);
    }
  }
}
