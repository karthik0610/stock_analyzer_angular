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
  operatingProfitMargin: FinancialMetricOperatingMargin | null;
  dilutedEps: FinancialMetricEps | null;
  returnOnEquity: FinancialMetricRoe | null;
  returnOnAssets: FinancialMetricRoa | null;
  roce: FinancialMetricRoce | null;
  annualPriceRatios: FinancialAnnualPriceRatios | null;
  balanceSheetError?: string;
  annualPriceRatiosError?: string;
}

export interface FinancialMetricMargin {
  rate: number;
  year: number;
  denominatorField: 'interestEarned' | 'revenueFromOperations';
}

export interface FinancialMetricOperatingMargin {
  rate: number;
  year: number;
  formula: 'bankPpop' | 'ebitda' | 'operatingProfit';
}

export interface FinancialMetricEps {
  value: number;
  year: number;
  yoyRate: number | null;
}

export interface FinancialMetricRoe {
  rate: number;
  year: number;
}

export interface FinancialMetricRoa {
  rate: number;
  year: number;
}

export interface FinancialAnnualPriceRatios {
  year: number;
  header: string | null;
  pe: number | null;
  pb: number | null;
}

export type FinancialMetricRoce =
  | { status: 'notApplicable'; year: number }
  | {
      status: 'calculated';
      rate: number;
      year: number;
      capitalEmployedFormula: 'assetsLessCurrentLiabilities' | 'capitalReservesDebt';
    };

type FinancialMetricField = 'income' | 'profitLossForThePeriod';

export function calculateFinancialGrowthCagrs(
  payload: unknown,
  years: number,
  balanceSheetPayload?: unknown,
  annualPriceRatiosPayload?: unknown,
): FinancialGrowthCagrs {
  if (!Number.isInteger(years) || years < 1) {
    throw new RangeError('The CAGR period must be a positive whole number of years.');
  }

  const rows = findFinancialRows(payload);
  if (!rows) {
    return {
      revenue: null,
      netProfit: null,
      netProfitMargin: null,
      operatingProfitMargin: null,
      dilutedEps: null,
      returnOnEquity: null,
      returnOnAssets: null,
      roce: null,
      annualPriceRatios: calculateLatestAnnualPriceRatios(annualPriceRatiosPayload),
    };
  }

  const fiscalYears = rows
    .map((row) => toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']))
    .filter((year): year is number => year !== null);
  const endYear = Math.max(...fiscalYears);
  if (!Number.isFinite(endYear)) {
    return {
      revenue: null,
      netProfit: null,
      netProfitMargin: null,
      operatingProfitMargin: null,
      dilutedEps: null,
      returnOnEquity: null,
      returnOnAssets: null,
      roce: null,
      annualPriceRatios: calculateLatestAnnualPriceRatios(annualPriceRatiosPayload),
    };
  }

  const balanceSheetRows = findFinancialRows(balanceSheetPayload);
  return {
    revenue: calculateMetricCagr(rows, 'income', years, endYear),
    netProfit: calculateMetricCagr(rows, 'profitLossForThePeriod', years, endYear),
    netProfitMargin: calculateLatestNetProfitMargin(rows, endYear),
    operatingProfitMargin: calculateLatestOperatingProfitMargin(rows, endYear),
    dilutedEps: calculateLatestDilutedEps(rows, endYear),
    returnOnEquity: calculateLatestReturnOnEquity(
      rows,
      balanceSheetRows,
      endYear,
    ),
    returnOnAssets: calculateLatestReturnOnAssets(rows, balanceSheetRows, endYear),
    roce: calculateLatestRoce(rows, balanceSheetRows, endYear),
    annualPriceRatios: calculateLatestAnnualPriceRatios(annualPriceRatiosPayload),
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

function calculateLatestOperatingProfitMargin(
  rows: Record<string, unknown>[],
  latestYear: number,
): FinancialMetricOperatingMargin | null {
  let latest: { margin: FinancialMetricOperatingMargin; periodEnd: number } | null = null;

  for (const row of rows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    if (year !== latestYear) {
      continue;
    }

    const interestEarned = toFiniteNumber(row['interestEarned']);
    const isBank = interestEarned !== null && interestEarned > 0;
    let numerator: number | null = null;
    let denominator: number | null = null;
    let formula: FinancialMetricOperatingMargin['formula'] | null = null;

    if (isBank) {
      const income = toFiniteNumber(row['income']);
      const expenditure = toFiniteNumber(row['expenditureExcludingProvisions']);
      if (income !== null && income > 0 && expenditure !== null) {
        numerator = income - expenditure;
        denominator = income;
        formula = 'bankPpop';
      }
    } else {
      const revenue = toFiniteNumber(row['revenueFromOperations']);
      const ebitda = toFiniteNumber(row['ebitda']);
      const operatingProfit = toFiniteNumber(row['operatingProfit']);
      if (revenue !== null && revenue > 0) {
        if (ebitda !== null) {
          numerator = ebitda;
          denominator = revenue;
          formula = 'ebitda';
        } else if (operatingProfit !== null) {
          numerator = operatingProfit;
          denominator = revenue;
          formula = 'operatingProfit';
        }
      }
    }

    if (numerator === null || denominator === null || formula === null) {
      continue;
    }

    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    if (latest && periodEnd <= latest.periodEnd) {
      continue;
    }

    const rate = numerator / denominator;
    if (Number.isFinite(rate)) {
      latest = {
        margin: { rate, year, formula },
        periodEnd,
      };
    }
  }

  return latest?.margin ?? null;
}

function calculateLatestDilutedEps(
  rows: Record<string, unknown>[],
  latestYear: number,
): FinancialMetricEps | null {
  const epsByYear = new Map<number, { value: number; periodEnd: number }>();

  for (const row of rows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    if (year === null) {
      continue;
    }

    const profit = toFiniteNumber(row['profitOrLossAttributableToOwners']);
    const dilutedShares = toFiniteNumber(row['dilutedOutstandingShares']);
    if (profit === null || dilutedShares === null || dilutedShares <= 0) {
      continue;
    }

    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    const previous = epsByYear.get(year);
    if (previous && periodEnd <= previous.periodEnd) {
      continue;
    }

    const value = profit / dilutedShares;
    if (Number.isFinite(value)) {
      epsByYear.set(year, { value, periodEnd });
    }
  }

  const latest = epsByYear.get(latestYear);
  if (!latest) {
    return null;
  }

  const previous = epsByYear.get(latestYear - 1);
  const yoyRate = previous && previous.value > 0 ? latest.value / previous.value - 1 : null;
  return { value: latest.value, year: latestYear, yoyRate };
}

function calculateLatestReturnOnEquity(
  profitLossRows: Record<string, unknown>[],
  balanceSheetRows: Record<string, unknown>[] | null,
  latestYear: number,
): FinancialMetricRoe | null {
  if (!balanceSheetRows) {
    return null;
  }

  let latestProfit: { value: number; periodEnd: number } | null = null;
  for (const row of profitLossRows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    if (year !== latestYear) {
      continue;
    }

    const value =
      toFiniteNumber(row['profitOrLossAttributableToOwners']) ??
      toFiniteNumber(row['profitLossForThePeriod']);
    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    if (value !== null && (!latestProfit || periodEnd > latestProfit.periodEnd)) {
      latestProfit = { value, periodEnd };
    }
  }

  let latestEquity: { value: number; periodEnd: number } | null = null;
  for (const row of balanceSheetRows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    if (year !== latestYear) {
      continue;
    }

    const value = toShareholdersEquity(row);
    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    if (value !== null && (!latestEquity || periodEnd > latestEquity.periodEnd)) {
      latestEquity = { value, periodEnd };
    }
  }

  if (!latestProfit || !latestEquity) {
    return null;
  }

  const rate = latestProfit.value / latestEquity.value;
  return Number.isFinite(rate) ? { rate, year: latestYear } : null;
}

function calculateLatestReturnOnAssets(
  profitLossRows: Record<string, unknown>[],
  balanceSheetRows: Record<string, unknown>[] | null,
  latestYear: number,
): FinancialMetricRoa | null {
  if (!balanceSheetRows) {
    return null;
  }

  const profitLossRow = findLatestRowForYear(profitLossRows, latestYear);
  const balanceSheetRow = findLatestRowForYear(balanceSheetRows, latestYear);
  if (!profitLossRow || !balanceSheetRow) {
    return null;
  }

  const profit = toFiniteNumber(profitLossRow['profitOrLossAttributableToOwners']);
  const assets = toFiniteNumber(balanceSheetRow['assets']);
  if (profit === null || assets === null || assets <= 0) {
    return null;
  }

  const rate = profit / assets;
  return Number.isFinite(rate) ? { rate, year: latestYear } : null;
}

function toShareholdersEquity(row: Record<string, unknown>): number | null {
  const capital = toFiniteNumber(row['capital']);
  const reserves = toFiniteNumber(row['reserves']);
  if (capital === null || reserves === null) {
    return null;
  }

  const shareholdersEquity = capital + reserves;
  return Number.isFinite(shareholdersEquity) && shareholdersEquity > 0
    ? shareholdersEquity
    : null;
}

function calculateLatestRoce(
  profitLossRows: Record<string, unknown>[],
  balanceSheetRows: Record<string, unknown>[] | null,
  latestYear: number,
): FinancialMetricRoce | null {
  const profitLossRow = findLatestRowForYear(profitLossRows, latestYear);
  if (!profitLossRow) {
    return null;
  }

  const interestEarned = toFiniteNumber(profitLossRow['interestEarned']);
  if (interestEarned !== null && interestEarned > 0) {
    return { status: 'notApplicable', year: latestYear };
  }

  const profitBeforeTax = toFiniteNumber(profitLossRow['profitLossBeforeTax']);
  const financeCosts = toFiniteNumber(profitLossRow['financeCosts']);
  if (profitBeforeTax === null || financeCosts === null || !balanceSheetRows) {
    return null;
  }

  const balanceSheetRow = findLatestRowForYear(balanceSheetRows, latestYear);
  if (!balanceSheetRow) {
    return null;
  }

  const capitalEmployed = calculateCapitalEmployed(balanceSheetRow);
  if (!capitalEmployed) {
    return null;
  }

  const ebit = profitBeforeTax + financeCosts;
  const rate = ebit / capitalEmployed.value;
  return Number.isFinite(rate)
    ? {
        status: 'calculated',
        rate,
        year: latestYear,
        capitalEmployedFormula: capitalEmployed.formula,
      }
    : null;
}

function findLatestRowForYear(
  rows: Record<string, unknown>[],
  targetYear: number,
): Record<string, unknown> | null {
  let latest: { row: Record<string, unknown>; periodEnd: number } | null = null;
  for (const row of rows) {
    const year = toFiscalYear(row['year']) ?? toFiscalYear(row['period_end']);
    if (year !== targetYear) {
      continue;
    }

    const periodEnd = toPeriodEnd(row['period_end']) ?? year;
    if (!latest || periodEnd > latest.periodEnd) {
      latest = { row, periodEnd };
    }
  }

  return latest?.row ?? null;
}

function calculateCapitalEmployed(
  row: Record<string, unknown>,
): {
  value: number;
  formula: 'assetsLessCurrentLiabilities' | 'capitalReservesDebt';
} | null {
  const totalAssets = toFiniteNumber(row['totalAssets']);
  const currentLiabilities = toFiniteNumber(row['currentLiabilities']);
  if (totalAssets !== null && currentLiabilities !== null) {
    const value = totalAssets - currentLiabilities;
    if (Number.isFinite(value) && value > 0) {
      return { value, formula: 'assetsLessCurrentLiabilities' };
    }
  }

  const capital = toFiniteNumber(row['capital']);
  const reserves = toFiniteNumber(row['reserves']);
  const totalDebt = toFiniteNumber(row['totalDebt']) ?? toFiniteNumber(row['borrowings']);
  if (capital === null || reserves === null || totalDebt === null) {
    return null;
  }

  const value = capital + reserves + totalDebt;
  return Number.isFinite(value) && value > 0
    ? { value, formula: 'capitalReservesDebt' }
    : null;
}

function calculateLatestAnnualPriceRatios(
  payload: unknown,
): FinancialAnnualPriceRatios | null {
  const rows = findPriceRatioRows(payload);
  if (!rows) {
    return null;
  }

  let latest: { ratios: FinancialAnnualPriceRatios; isTtm: boolean } | null = null;
  for (const row of rows) {
    const year = toFiscalYear(row['year']);
    const pe = toFiniteNumber(row['pe']);
    const pb = toFiniteNumber(row['pb']);
    if (year === null || (pe === null && pb === null)) {
      continue;
    }

    const header = typeof row['header'] === 'string' ? row['header'] : null;
    const isTtm = header?.toLowerCase() === 'ttm';
    if (
      latest &&
      (year < latest.ratios.year ||
        (year === latest.ratios.year && (!isTtm || latest.isTtm)))
    ) {
      continue;
    }

    latest = { ratios: { year, header, pe, pb }, isTtm };
  }

  return latest?.ratios ?? null;
}

function findPriceRatioRows(value: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(value)) {
    const rows = value.filter(isRecord);
    return rows.length > 0 ? rows : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if ('price_ratios' in value) {
    const rows = findPriceRatioRows(value['price_ratios']);
    if (rows) {
      return rows;
    }
  }

  for (const nested of Object.values(value)) {
    const rows = findPriceRatioRows(nested);
    if (rows) {
      return rows;
    }
  }

  return null;
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
