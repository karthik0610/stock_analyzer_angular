import { calculateFinancialGrowthCagrs } from './revenue-growth';

describe('calculateFinancialGrowthCagrs', () => {
  it('calculates revenue and net profit CAGR from the latest fiscal year', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        symbol: 'EXAMPLE',
        financials: [
          { year: 2026, income: 1331, profitLossForThePeriod: 665.5 },
          { year: 2025, income: 1210, profitLossForThePeriod: 605 },
          { year: 2024, income: 1100, profitLossForThePeriod: 550 },
          { year: 2023, income: 1000, profitLossForThePeriod: 500 },
          { year: 2022, income: 900, profitLossForThePeriod: 450 },
        ],
      },
      3,
    );

    expect(result.revenue?.rate).toBeCloseTo(0.1, 10);
    expect(result.revenue?.startYear).toBe(2023);
    expect(result.revenue?.endYear).toBe(2026);
    expect(result.netProfit?.rate).toBeCloseTo(0.1, 10);
    expect(result.netProfit?.startYear).toBe(2023);
    expect(result.netProfit?.endYear).toBe(2026);
  });

  it('keeps unavailable metrics independent when a baseline value is missing', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          { year: 2026, income: 1331, profitLossForThePeriod: 665.5 },
          { year: 2023, income: 1000, profitLossForThePeriod: 0 },
        ],
      },
      3,
    );

    expect(result.revenue?.rate).toBeCloseTo(0.1, 10);
    expect(result.netProfit).toBeNull();
  });

  it('calculates the HDFC sample net-profit CAGR across FY2023 to FY2026', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          { year: 2026, profitLossForThePeriod: 792194600000 },
          { year: 2025, profitLossForThePeriod: 734401700000 },
          { year: 2024, profitLossForThePeriod: 654465000000 },
          { year: 2023, profitLossForThePeriod: 461487000000 },
          { year: 2022, profitLossForThePeriod: 381509000000 },
        ],
      },
      3,
    );

    expect(result.netProfit?.rate).toBeCloseTo(0.1973583, 6);
    expect(result.netProfit?.startYear).toBe(2023);
    expect(result.netProfit?.endYear).toBe(2026);
  });

  it('calculates a bank net profit margin from owners’ profit and interest earned', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2025,
            profitOrLossAttributableToOwners: 100,
            interestEarned: 200,
          },
          {
            year: 2026,
            profitOrLossAttributableToOwners: 760259700000,
            interestEarned: 3486151500000,
          },
        ],
      },
      3,
    );

    expect(result.netProfitMargin?.rate).toBeCloseTo(
      760259700000 / 3486151500000,
      12,
    );
    expect(result.netProfitMargin?.year).toBe(2026);
    expect(result.netProfitMargin?.denominatorField).toBe('interestEarned');
  });

  it('calculates a non-bank net profit margin from revenue from operations only', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            profitOrLossAttributableToOwners: 300,
            revenueFromOperations: 1000,
            otherIncome: 250,
          },
        ],
      },
      3,
    );

    expect(result.netProfitMargin?.rate).toBe(0.3);
    expect(result.netProfitMargin?.year).toBe(2026);
    expect(result.netProfitMargin?.denominatorField).toBe('revenueFromOperations');
  });

  it('returns unavailable metrics when the exact starting fiscal year is absent', () => {
    const result = calculateFinancialGrowthCagrs(
      { financials: [{ year: 2026, income: 1331 }, { year: 2024, income: 1100 }] },
      3,
    );

    expect(result.revenue).toBeNull();
    expect(result.netProfit).toBeNull();
  });
});
