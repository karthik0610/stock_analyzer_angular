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

  it('calculates bank operating margin from PPOP over total income', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            interestEarned: 3486151500000,
            income: 4954628100000,
            expenditureExcludingProvisions: 3666651400000,
          },
        ],
      },
      3,
    );

    expect(result.operatingProfitMargin?.rate).toBeCloseTo(
      (4954628100000 - 3666651400000) / 4954628100000,
      12,
    );
    expect(result.operatingProfitMargin?.year).toBe(2026);
    expect(result.operatingProfitMargin?.formula).toBe('bankPpop');
  });

  it('uses EBITDA or operating profit over revenue for non-bank operating margin', () => {
    const ebitdaResult = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            revenueFromOperations: 1000,
            ebitda: 240,
            operatingProfit: 200,
          },
        ],
      },
      3,
    );
    const operatingProfitResult = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            revenueFromOperations: 1000,
            operatingProfit: 200,
          },
        ],
      },
      3,
    );

    expect(ebitdaResult.operatingProfitMargin?.rate).toBe(0.24);
    expect(ebitdaResult.operatingProfitMargin?.formula).toBe('ebitda');
    expect(operatingProfitResult.operatingProfitMargin?.rate).toBe(0.2);
    expect(operatingProfitResult.operatingProfitMargin?.formula).toBe('operatingProfit');
  });

  it('calculates diluted EPS from owners’ profit and diluted shares for the latest year', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2025,
            profitOrLossAttributableToOwners: 707922500000,
            dilutedOutstandingShares: 15304443348,
          },
          {
            year: 2026,
            profitOrLossAttributableToOwners: 760259700000,
            dilutedOutstandingShares: 15393368328,
          },
        ],
      },
      3,
    );

    expect(result.dilutedEps?.value).toBeCloseTo(
      760259700000 / 15393368328,
      12,
    );
    expect(result.dilutedEps?.yoyRate).toBeCloseTo(
      (760259700000 / 15393368328) / (707922500000 / 15304443348) - 1,
      12,
    );
    expect(result.dilutedEps?.year).toBe(2026);
  });

  it('calculates ROE using owner profit and balance-sheet capital plus reserves', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            profitOrLossAttributableToOwners: 760259700000,
            profitLossForThePeriod: 792194600000,
          },
        ],
      },
      3,
      {
        financials: [
          { year: 2025, capital: 7652200000, reserves: 5172189800000 },
          {
            year: 2026,
            capital: 15393400000,
            reserves: 5799750200000,
            minorityInterest: 31934900000,
            nonControllingInterest: 31934900000,
          },
        ],
      },
    );

    expect(result.returnOnEquity?.rate).toBeCloseTo(
      760259700000 / (15393400000 + 5799750200000),
      12,
    );
    expect(result.returnOnEquity?.year).toBe(2026);
  });

  it('falls back to profit for the period when owner profit is absent', () => {
    const result = calculateFinancialGrowthCagrs(
      { financials: [{ year: 2026, profitLossForThePeriod: 500 }] },
      3,
      {
        financials: [
          {
            year: 2026,
            capital: 100,
            reserves: 400,
            nonControllingInterest: 2000,
          },
        ],
      },
    );

    expect(result.returnOnEquity?.rate).toBe(1);
    expect(result.returnOnEquity?.year).toBe(2026);
  });

  it('calculates non-bank ROCE from EBIT and assets less current liabilities', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            profitLossBeforeTax: 120,
            financeCosts: 30,
            interestEarned: 0,
          },
        ],
      },
      3,
      {
        financials: [
          { year: 2026, totalAssets: 1000, currentLiabilities: 400 },
        ],
      },
    );

    expect(result.roce).toEqual({
      status: 'calculated',
      rate: 0.25,
      year: 2026,
      capitalEmployedFormula: 'assetsLessCurrentLiabilities',
    });
  });

  it('uses capital, reserves, and total debt when current liabilities are unavailable', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            profitLossBeforeTax: 80,
            financeCosts: 20,
            interestEarned: 0,
          },
        ],
      },
      3,
      {
        financials: [
          { year: 2026, capital: 100, reserves: 400, totalDebt: 500 },
        ],
      },
    );

    expect(result.roce).toEqual({
      status: 'calculated',
      rate: 0.1,
      year: 2026,
      capitalEmployedFormula: 'capitalReservesDebt',
    });
  });

  it('marks ROCE not applicable for banks with positive interest earned', () => {
    const result = calculateFinancialGrowthCagrs(
      {
        financials: [
          {
            year: 2026,
            interestEarned: 1000,
            profitLossBeforeTax: 200,
            financeCosts: 100,
          },
        ],
      },
      3,
    );

    expect(result.roce).toEqual({ status: 'notApplicable', year: 2026 });
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
