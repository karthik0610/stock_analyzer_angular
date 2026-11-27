export function parseSectorPeers(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload['peers'])) {
    throw new Error('FinEdge returned an invalid sector peers response.');
  }

  const peers: string[] = [];
  const seen = new Set<string>();
  for (const value of payload['peers']) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('FinEdge returned an invalid symbol in the sector peers list.');
    }

    const symbol = value.trim();
    const key = symbol.toUpperCase();
    if (!seen.has(key)) {
      peers.push(symbol);
      seen.add(key);
    }
  }

  return peers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
