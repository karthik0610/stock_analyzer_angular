export interface MarketCandle {
  index: number;
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type FvgDirection = 'bullish' | 'bearish';
export type FvgStatus =
  | 'unmitigated'
  | 'partially mitigated'
  | 'fully mitigated'
  | 'invalidated';

export interface FvgZone {
  direction: FvgDirection;
  lower: number;
  upper: number;
  gapSize: number;
  atr: number;
  gapAtrRatio: number;
  middleBodyAtrRatio: number;
  volumeRatio: number;
  breakOfStructure: boolean;
  status: FvgStatus;
  qualified: boolean;
  formedAt: number;
  formedAtIndex: number;
}

export interface FvgRuleConfig {
  atrPeriod: number;
  minimumGapAtrRatio: number;
  minimumMiddleBodyAtrRatio: number;
  volumeLookback: number;
  minimumVolumeRatio: number;
  structureLookback: number;
}

export const FVG_RULE_CONFIG: Readonly<FvgRuleConfig> = Object.freeze({
  atrPeriod: 14,
  minimumGapAtrRatio: 0.15,
  minimumMiddleBodyAtrRatio: 0.5,
  volumeLookback: 14,
  minimumVolumeRatio: 1.5,
  structureLookback: 10,
});

export interface FvgAnalysis {
  zones: FvgZone[];
  latestBullish: FvgZone | null;
  latestBearish: FvgZone | null;
  latestQualifiedBullish: FvgZone | null;
  latestQualifiedBearish: FvgZone | null;
}

export function analyzeFairValueGaps(
  candles: readonly MarketCandle[],
  config: Readonly<FvgRuleConfig> = FVG_RULE_CONFIG,
): FvgAnalysis {
  const zones: FvgZone[] = [];

  for (let thirdIndex = config.atrPeriod + 2; thirdIndex < candles.length; thirdIndex += 1) {
    const first = candles[thirdIndex - 2];
    const middle = candles[thirdIndex - 1];
    const third = candles[thirdIndex];
    let direction: FvgDirection | null = null;
    let lower = 0;
    let upper = 0;

    if (third.low > first.high) {
      direction = 'bullish';
      lower = first.high;
      upper = third.low;
    } else if (third.high < first.low) {
      direction = 'bearish';
      lower = third.high;
      upper = first.low;
    }

    if (!direction) {
      continue;
    }

    const atr = calculateAtr(candles, thirdIndex, config.atrPeriod);
    const gapSize = upper - lower;
    const gapAtrRatio = gapSize / atr;
    const middleBodyAtrRatio = Math.abs(middle.close - middle.open) / atr;
    const volumeRatio = middle.volume / averageVolumeBefore(
      candles,
      thirdIndex - 1,
      config.volumeLookback,
    );
    const breakOfStructure = hasStructureBreak(
      candles,
      thirdIndex - 1,
      direction,
      config.structureLookback,
    );
    const status = getMitigationStatus(
      candles,
      thirdIndex,
      direction,
      lower,
      upper,
    );

    zones.push({
      direction,
      lower,
      upper,
      gapSize,
      atr,
      gapAtrRatio,
      middleBodyAtrRatio,
      volumeRatio,
      breakOfStructure,
      status,
      qualified:
        gapAtrRatio >= config.minimumGapAtrRatio &&
        middleBodyAtrRatio >= config.minimumMiddleBodyAtrRatio &&
        volumeRatio >= config.minimumVolumeRatio &&
        status !== 'fully mitigated' &&
        status !== 'invalidated',
      formedAt: third.timestamp,
      formedAtIndex: third.index,
    });
  }

  return {
    zones,
    latestBullish: latestZone(zones, 'bullish'),
    latestBearish: latestZone(zones, 'bearish'),
    latestQualifiedBullish: latestZone(zones, 'bullish', true),
    latestQualifiedBearish: latestZone(zones, 'bearish', true),
  };
}

export function calculateAtr(
  candles: readonly MarketCandle[],
  endIndex: number,
  period: number,
): number {
  if (period <= 0 || endIndex < period || endIndex >= candles.length) {
    return Number.EPSILON;
  }

  let atr = 0;
  for (let index = 1; index <= period; index += 1) {
    const candle = candles[index];
    const previousClose = candles[index - 1].close;
    atr += Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  }
  atr /= period;

  for (let index = period + 1; index <= endIndex; index += 1) {
    const candle = candles[index];
    const previousClose = candles[index - 1].close;
    const trueRange = Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
    atr = (atr * (period - 1) + trueRange) / period;
  }

  return Number.isFinite(atr) && atr > 0 ? atr : Number.EPSILON;
}

function averageVolumeBefore(
  candles: readonly MarketCandle[],
  candleIndex: number,
  lookback: number,
): number {
  const volumes = candles.slice(Math.max(0, candleIndex - lookback), candleIndex);
  const average = volumes.reduce((total, candle) => total + candle.volume, 0) / volumes.length;
  return Number.isFinite(average) && average > 0 ? average : Number.EPSILON;
}

function hasStructureBreak(
  candles: readonly MarketCandle[],
  middleIndex: number,
  direction: FvgDirection,
  lookback: number,
): boolean {
  const priorCandles = candles.slice(Math.max(0, middleIndex - lookback), middleIndex);
  if (priorCandles.length === 0) {
    return false;
  }

  if (direction === 'bullish') {
    return candles[middleIndex].close > Math.max(...priorCandles.map((candle) => candle.high));
  }

  return candles[middleIndex].close < Math.min(...priorCandles.map((candle) => candle.low));
}

function getMitigationStatus(
  candles: readonly MarketCandle[],
  formedAtIndex: number,
  direction: FvgDirection,
  lower: number,
  upper: number,
): FvgStatus {
  for (let index = formedAtIndex + 1; index < candles.length; index += 1) {
    const candle = candles[index];

    if (direction === 'bullish') {
      if (candle.close < lower) {
        return 'invalidated';
      }
      if (candle.low <= lower) {
        return 'fully mitigated';
      }
      if (candle.low <= upper) {
        return 'partially mitigated';
      }
    } else {
      if (candle.close > upper) {
        return 'invalidated';
      }
      if (candle.high >= upper) {
        return 'fully mitigated';
      }
      if (candle.high >= lower) {
        return 'partially mitigated';
      }
    }
  }

  return 'unmitigated';
}

function latestZone(
  zones: readonly FvgZone[],
  direction: FvgDirection,
  qualifiedOnly = false,
): FvgZone | null {
  return zones
    .filter((zone) => zone.direction === direction && (!qualifiedOnly || zone.qualified))
    .at(-1) ?? null;
}
