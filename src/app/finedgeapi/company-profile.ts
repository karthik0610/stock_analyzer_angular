function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCompanyDescription(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new Error('FinEdge returned an invalid company profile.');
  }

  const description = payload['description'];
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('FinEdge company profile did not include a description.');
  }

  return description.trim();
}
