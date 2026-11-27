export interface StockQuote {
  symbol: string;
  changePercent: number;
  currentPrice: number;
  high52: number;
  highPrice: number;
  low52: number;
  lowPrice: number;
  marketCap: number;
  openPrice: number;
  shares: number;
  tradeTime: string;
  volume: number;
}

export function parseStockQuote(payload: unknown, requestedSymbol: string): StockQuote {
  if (!isRecord(payload)) {
    throw new Error('FinEdge returned an invalid quote response.');
  }

  const symbolKey = Object.keys(payload).find(
    (key) => key.toUpperCase() === requestedSymbol.toUpperCase(),
  );
  const quotePayload = symbolKey ? payload[symbolKey] : null;
  if (!symbolKey || !isRecord(quotePayload)) {
    throw new Error(`FinEdge did not return quote data for ${requestedSymbol}.`);
  }
  const quote = quotePayload;

  const change = quote['change'];
  const changeMatch =
    typeof change === 'string' ? /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))%$/.exec(change.trim()) : null;
  if (!changeMatch) {
    throw new Error(`FinEdge returned an invalid price change for ${requestedSymbol}.`);
  }

  const tradeTime = quote['tradetime'];
  if (
    typeof tradeTime !== 'string' ||
    tradeTime.trim().length === 0 ||
    !Number.isFinite(Date.parse(tradeTime))
  ) {
    throw new Error(`FinEdge returned an invalid trade time for ${requestedSymbol}.`);
  }

  return {
    symbol: symbolKey,
    changePercent: Number(changeMatch[1]),
    currentPrice: readNumber(quote, 'current_price', requestedSymbol),
    high52: readNumber(quote, 'high52', requestedSymbol),
    highPrice: readNumber(quote, 'high_price', requestedSymbol),
    low52: readNumber(quote, 'low52', requestedSymbol),
    lowPrice: readNumber(quote, 'low_price', requestedSymbol),
    marketCap: readNumber(quote, 'market_cap', requestedSymbol),
    openPrice: readNumber(quote, 'open_price', requestedSymbol),
    shares: readNumber(quote, 'shares', requestedSymbol),
    tradeTime: tradeTime.trim(),
    volume: readNumber(quote, 'volume', requestedSymbol),
  };
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  symbol: string,
): number {
  const value = record[key];
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(number)) {
    throw new Error(`FinEdge returned an invalid ${key} value for ${symbol}.`);
  }
  return number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
