export interface ShareholdingPosition {
  current: number;
  change: number;
}

export interface ShareholdingPatternMetrics {
  latestQuarter: string;
  previousQuarter: string;
  promoter: ShareholdingPosition;
  fii: ShareholdingPosition;
  dii: ShareholdingPosition;
  retail: ShareholdingPosition;
  netInstitutionalChange: number;
}

const SHAREHOLDING_CATEGORIES = {
  promoter: 'Promoters',
  fii: 'InstitutionsForeign',
  dii: 'InstitutionsDomestic',
  retail: 'NonInstitutions',
} as const;

export function calculateShareholdingPattern(payload: unknown): ShareholdingPatternMetrics {
  if (
    !isRecord(payload) ||
    !Array.isArray(payload['columns']) ||
    !Array.isArray(payload['rows'])
  ) {
    throw new Error('FinEdge returned an invalid quarterly shareholding pattern.');
  }

  const columns: string[] = [];
  for (const column of payload['columns']) {
    if (typeof column !== 'string' || column.length === 0) {
      throw new Error('FinEdge shareholding data must include valid quarter columns.');
    }
    columns.push(column);
  }
  if (columns.length < 2) {
    throw new Error('FinEdge shareholding data must include at least two quarter columns.');
  }

  const latestQuarter = columns[columns.length - 1];
  const previousQuarter = columns[columns.length - 2];
  const rows = payload['rows'].filter(isRecord);
  const promoter = getPosition(
    rows,
    SHAREHOLDING_CATEGORIES.promoter,
    latestQuarter,
    previousQuarter,
  );
  const fii = getPosition(rows, SHAREHOLDING_CATEGORIES.fii, latestQuarter, previousQuarter);
  const dii = getPosition(rows, SHAREHOLDING_CATEGORIES.dii, latestQuarter, previousQuarter);
  const retail = getPosition(rows, SHAREHOLDING_CATEGORIES.retail, latestQuarter, previousQuarter);

  return {
    latestQuarter,
    previousQuarter,
    promoter,
    fii,
    dii,
    retail,
    netInstitutionalChange: fii.change + dii.change,
  };
}

function getPosition(
  rows: Record<string, unknown>[],
  category: string,
  latestQuarter: string,
  previousQuarter: string,
): ShareholdingPosition {
  const row = rows.find(
    (candidate) => (candidate['catagory'] ?? candidate['category']) === category,
  );
  const data = row && isRecord(row['data']) ? row['data'] : {};
  const current = readPercentage(data[latestQuarter], category, latestQuarter);
  const previous = readPercentage(data[previousQuarter], category, previousQuarter);

  return { current, change: current - previous };
}

function readPercentage(value: unknown, category: string, quarter: string): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const percentage =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(percentage)) {
    throw new Error(`FinEdge returned an invalid ${category} percentage for ${quarter}.`);
  }

  return percentage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
