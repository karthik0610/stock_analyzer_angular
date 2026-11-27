export interface FinancialMetricCagr {
  rate: number;
  startYear: number;
  endYear: number;
  years: number;
}

export interface FinancialGrowthCagrs {
  revenue: FinancialMetricCagr | null;
  netProfit: FinancialMetricCagr | null;
  netProfitMargin: FinancialMetricMargin | null;
}

export interface FinancialMetricMargin {
  rate: number;
  year: number;
  denominatorField: 'interestEarned' | 'revenueFromOperations';
}

type FinancialMetricField = 'income' | 'profitLossForThePeriod';

export function calculateFinancialGrowthCagrs(
  payload: unknown,
  years: number,
): FinancialGrowthCagrs {
  if (!Number.isInteger(years) || years < 1) {
    throw new RangeError('The CAGR period must be a positive whole number of years.');
  }

  const rows = findFinancialRows(payload);
  if (!rows) {
    return { revenue: null, netProfit: null, netProfitMargin: null };
  }

  const fiscalYears = rows
    .map((row) => toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']))
    .filter((year): year is number => year !== null);
  const endYear = Math.max(...fiscalYears);
  if (!Number.isFinite(endYear)) {
    return { revenue: null, netProfit: null, netProfitMargin: null };
  }

  return {
    revenue: calculateMetricCagr(rows, 'income', years, endYear),
    netProfit: calculateMetricCagr(rows, 'profitLossForThePeriod', years, endYear),
    netProfitMargin: calculateLatestNetProfitMargin(rows, endYear),
  };
}

function calculateMetricCagr(
  rows: Record<string, unknown>[],
  field: FinancialMetricField,
  years: number,
  endYear: number,
): FinancialMetricCagr | null {
  const valuesByYear = new Map<number, { value: number; periodEnd: number }>();
  for (const row of rows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    const value = toFiniteNumber(row[field]);
    if (year === null || value === null) {
      continue;
    }

    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    const previous = valuesByYear.get(year);
    if (!previous || periodEnd > previous.periodEnd) {
      valuesByYear.set(year, { value, periodEnd });
    }
  }

  const latestValue = valuesByYear.get(endYear)?.value;
  const startYear = endYear - years;
  const startingValue = valuesByYear.get(startYear)?.value;
  if (
    latestValue === undefined ||
    startingValue === undefined ||
    startingValue <= 0 ||
    latestValue < 0
  ) {
    return null;
  }

  const rate = Math.pow(latestValue / startingValue, 1 / years) - 1;
  return Number.isFinite(rate) ? { rate, startYear, endYear, years } : null;
}

function calculateLatestNetProfitMargin(
  rows: Record<string, unknown>[],
  latestYear: number,
): FinancialMetricMargin | null {
  let latest: { margin: FinancialMetricMargin; periodEnd: number } | null = null;

  for (const row of rows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    if (year !== latestYear) {
      continue;
    }

    const profit = toFiniteNumber(row['profitOrLossAttributableToOwners']);
    const interestEarned = toFiniteNumber(row['interestEarned']);
    const revenueFromOperations = toFiniteNumber(row['revenueFromOperations']);
    let denominatorField: FinancialMetricMargin['denominatorField'] | null = null;
    let denominator: number | null = null;
    if (interestEarned !== null && interestEarned > 0) {
      denominatorField = 'interestEarned';
      denominator = interestEarned;
    } else if (revenueFromOperations !== null && revenueFromOperations > 0) {
      denominatorField = 'revenueFromOperations';
      denominator = revenueFromOperations;
    }

    if (profit === null || denominator === null || denominatorField === null) {
      continue;
    }

    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    if (latest && periodEnd <= latest.periodEnd) {
      continue;
    }

    const rate = profit / denominator;
    if (Number.isFinite(rate)) {
      latest = {
        margin: { rate, year, denominatorField },
        periodEnd,
      };
    }
  }

  return latest?.margin ?? null;
}

function findFinancialRows(value: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(value)) {
    const rows = value.filter(isRecord);
    return rows.length > 0 ? rows : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of ['financials', 'data', 'results']) {
    if (key in value) {
      const rows = findFinancialRows(value[key]);
      if (rows) {
        return rows;
      }
    }
  }

  for (const nested of Object.values(value)) {
    const rows = findFinancialRows(nested);
    if (rows) {
      return rows;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toFiscalYear(value: unknown): number | null {
  const number = toFiniteNumber(value);
  if (number === null) {
    return null;
  }

  const year = Math.trunc(number >= 10_000_000 ? number / 10_000 : number);
  return year >= 1900 && year <= 2200 ? year : null;
}

function toPeriodEnd(value: unknown): number | null {
  const number = toFiniteNumber(value);
  return number === null ? null : number;
}
