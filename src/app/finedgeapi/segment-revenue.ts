export interface SegmentRevenueNames {
  header: string;
  names: string[];
}

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

export function parseLatestSegmentRevenueNames(payload: unknown): SegmentRevenueNames {
  if (!isRecord(payload) || !Array.isArray(payload['segment_revenues'])) {
    throw new Error('FinEdge returned an invalid segment revenue response.');
  }

  const rows: unknown[] = payload['segment_revenues'];
  const periods = rows.map((value: unknown) => {
    if (
      !isRecord(value) ||
      typeof value['header'] !== 'string' ||
      !Array.isArray(value['segments'])
    ) {
      throw new Error('FinEdge returned an invalid segment revenue period.');
    }

    const header = value['header'].trim();
    const periodKey = parsePeriodHeader(header);
    const segments: unknown[] = value['segments'];
    const names = segments.map((segment) => {
      if (
        !isRecord(segment) ||
        typeof segment['name'] !== 'string' ||
        segment['name'].trim().length === 0
      ) {
        throw new Error(`FinEdge returned an invalid segment name for ${header}.`);
      }
      return segment['name'].trim();
    });

    return { header, periodKey, names };
  });

  const latest = periods.reduce<(typeof periods)[number] | null>(
    (current, period) => (current === null || period.periodKey > current.periodKey ? period : current),
    null,
  );
  if (!latest || latest.names.length === 0) {
    throw new Error('FinEdge latest segment revenue period did not include segment names.');
  }

  return { header: latest.header, names: [...new Set(latest.names)] };
}

function parsePeriodHeader(header: string): number {
  const monthYear = /^([a-z]{3,9})\s+(\d{4})$/i.exec(header);
  if (monthYear) {
    const monthIndex = MONTHS.indexOf(monthYear[1].slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      return Number(monthYear[2]) * 12 + monthIndex;
    }
  }

  const isoDate = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(header);
  if (isoDate) {
    const monthIndex = Number(isoDate[2]) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return Number(isoDate[1]) * 12 + monthIndex;
    }
  }

  throw new Error(`FinEdge returned an unsupported segment period header: ${header}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
