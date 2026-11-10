import { Component } from '@angular/core';
import { largeCapStocks } from './large-cap-stocks';

type PriceRangeHandle = 'min' | 'max';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
})
export class WatchlistComponent {
  selectedFileName = '';
  fileError = '';
  searchQuery = '';
  isFilterOpen = false;
  minPrice = 0;
  maxPrice = 15_000;
  minChange = '';
  maxChange = '';
  private activePriceHandle: PriceRangeHandle | null = null;
  private appliedMinPrice = 0;
  private appliedMaxPrice = 15_000;
  private appliedMinChange: number | null = null;
  private appliedMaxChange: number | null = null;

  readonly stocks = largeCapStocks.map((stock, index) => {
    const positive = index % 3 !== 1;
    const price = 250 + ((index * 137.45) % 9_950);
    const change = 0.45 + ((index * 17) % 475) / 100;

    return {
      ...stock,
      priceValue: price,
      changeValue: positive ? change : -change,
      price: price.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      change: `${positive ? '+' : '-'}${change.toFixed(2)}%`,
      positive,
    };
  });

  get filteredStocks(): typeof this.stocks {
    const query = this.searchQuery.trim().toLocaleLowerCase();

    return this.stocks.filter((stock) => {
      const matchesSearch =
        query === '' ||
        stock.name.toLocaleLowerCase().includes(query) ||
        stock.symbol.toLocaleLowerCase().includes(query);
      const inPriceRange =
        stock.priceValue >= this.appliedMinPrice &&
        stock.priceValue <= this.appliedMaxPrice;
      const hasChangeFilter =
        this.appliedMinChange !== null || this.appliedMaxChange !== null;
      const meetsMinimum =
        this.appliedMinChange === null ||
        stock.changeValue >= this.appliedMinChange;
      const meetsMaximum =
        this.appliedMaxChange === null ||
        stock.changeValue <= this.appliedMaxChange;

      return (
        matchesSearch &&
        inPriceRange &&
        (!hasChangeFilter || stock.changeValue >= 0) &&
        meetsMinimum &&
        meetsMaximum
      );
    });
  }

  updateSearchQuery(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  get priceRangeLeft(): number {
    return (this.minPrice / 15_000) * 100;
  }

  get priceRangeWidth(): number {
    return ((this.maxPrice - this.minPrice) / 15_000) * 100;
  }

  get hasActiveFilters(): boolean {
    return (
      this.appliedMinPrice > 0 ||
      this.appliedMaxPrice < 15_000 ||
      this.appliedMinChange !== null ||
      this.appliedMaxChange !== null
    );
  }

  openFilePicker(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
    this.minPrice = this.appliedMinPrice;
    this.maxPrice = this.appliedMaxPrice;
    this.minChange = this.appliedMinChange?.toString() ?? '';
    this.maxChange = this.appliedMaxChange?.toString() ?? '';
  }

  startPriceDrag(handle: PriceRangeHandle, event: PointerEvent): void {
    this.activePriceHandle = handle;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.updatePriceFromPointer(handle, event);
    event.preventDefault();
  }

  movePriceDrag(event: PointerEvent): void {
    if (this.activePriceHandle) {
      this.updatePriceFromPointer(this.activePriceHandle, event);
    }
  }

  endPriceDrag(event: PointerEvent): void {
    if (this.activePriceHandle) {
      const handle = event.currentTarget as HTMLElement;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      this.activePriceHandle = null;
    }
  }

  onPriceHandleKeydown(handle: PriceRangeHandle, event: KeyboardEvent): void {
    const currentValue = handle === 'min' ? this.minPrice : this.maxPrice;
    let nextValue = currentValue;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextValue += event.shiftKey ? 500 : 100;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        nextValue -= event.shiftKey ? 500 : 100;
        break;
      case 'Home':
        nextValue = 0;
        break;
      case 'End':
        nextValue = 15_000;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.setPriceBound(handle, nextValue);
  }

  updateMinChange(event: Event): void {
    this.minChange = (event.target as HTMLInputElement).value;
  }

  updateMaxChange(event: Event): void {
    this.maxChange = (event.target as HTMLInputElement).value;
  }

  applyFilters(): void {
    this.appliedMinPrice = this.minPrice;
    this.appliedMaxPrice = this.maxPrice;
    this.appliedMinChange = this.parsePercentage(this.minChange);
    this.appliedMaxChange = this.parsePercentage(this.maxChange);
    this.isFilterOpen = false;
  }

  clearFilters(): void {
    this.minPrice = 0;
    this.maxPrice = 15_000;
    this.minChange = '';
    this.maxChange = '';
    this.applyFilters();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.fileError = 'Choose an .xlsx file.';
      this.selectedFileName = '';
      input.value = '';
      return;
    }

    this.selectedFileName = file.name;
    this.fileError = '';
  }

  private parsePercentage(value: string): number | null {
    if (value.trim() === '') {
      return null;
    }

    const percentage = Number(value);
    return Number.isFinite(percentage) && percentage >= 0 ? percentage : null;
  }

  private updatePriceFromPointer(handle: PriceRangeHandle, event: PointerEvent): void {
    const track = (event.currentTarget as HTMLElement).parentElement;
    if (!track) {
      return;
    }

    const bounds = track.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const value = Math.round((progress * 15_000) / 100) * 100;
    this.setPriceBound(handle, value);
  }

  private setPriceBound(handle: PriceRangeHandle, value: number): void {
    if (handle === 'min') {
      this.minPrice = Math.min(Math.max(value, 0), this.maxPrice);
      return;
    }

    this.maxPrice = Math.max(Math.min(value, 15_000), this.minPrice);
  }
}
