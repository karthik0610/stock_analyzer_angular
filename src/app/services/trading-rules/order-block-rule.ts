import { calculateAtr, MarketCandle } from './fvg-rule';

export type OrderBlockDirection = 'bullish' | 'bearish';
export type OrderBlockStatus =
  | 'fresh'
  | 'touched'
  | 'partially mitigated'
  | 'fully mitigated'
  | 'invalidated';

export interface OrderBlockRuleConfig {
  atrPeriod: number;
  minimumDisplacementAtrRatio: number;
  structureLookback: number;
  maximumDisplacementCandles: number;
  volumeLookback: number;
  preferredVolumeRatio: number;
}

export const ORDER_BLOCK_RULE_CONFIG: Readonly<OrderBlockRuleConfig> = Object.freeze({
  atrPeriod: 14,
  minimumDisplacementAtrRatio: 1,
  structureLookback: 10,
  maximumDisplacementCandles: 3,
  volumeLookback: 14,
  preferredVolumeRatio: 1.5,
});

export interface OrderBlockZone {
  direction: OrderBlockDirection;
  lower: number;
  upper: number;
  status: OrderBlockStatus;
  displacementAtrRatio: number;
  volumeRatio: number;
  volumeExpanded: boolean;
  breakOfStructure: boolean;
  qualified: boolean;
  formedAt: number;
  formedAtIndex: number;
  sourceCandleIndex: number;
  displacementCandleIndex: number;
  bosCandleIndex: number;
}

export interface OrderBlockAnalysis {
  zones: OrderBlockZone[];
  latestBullish: OrderBlockZone | null;
  latestBearish: OrderBlockZone | null;
  latestQualifiedBullish: OrderBlockZone | null;
  latestQualifiedBearish: OrderBlockZone | null;
}

export function analyzeOrderBlocks(
  candles: readonly MarketCandle[],
  config: Readonly<OrderBlockRuleConfig> = ORDER_BLOCK_RULE_CONFIG,
): OrderBlockAnalysis {
  const zones: OrderBlockZone[] = [];
  const firstCandidateIndex = Math.max(config.atrPeriod, config.structureLookback) + 1;

  for (let sourceIndex = firstCandidateIndex; sourceIndex < candles.length - 1; sourceIndex += 1) {
    const source = candles[sourceIndex];
    const direction: OrderBlockDirection | null =
      source.close < source.open
        ? 'bullish'
        : source.close > source.open
          ? 'bearish'
          : null;

    if (!direction) {
      continue;
    }

    const displacementEnd = findDisplacementEnd(candles, sourceIndex, direction, config);
    if (displacementEnd === null) {
      continue;
    }

    const displacement = findQualifyingDisplacement(
      candles,
      sourceIndex,
      displacementEnd,
      direction,
      config,
    );
    const bosIndex = findBreakOfStructure(
      candles,
      sourceIndex + 1,
      displacementEnd,
      direction,
      config.structureLookback,
    );

    if (!displacement || bosIndex === null) {
      continue;
    }

    const volumeRatio = displacement.maximumVolume / averageVolumeBefore(
      candles,
      sourceIndex,
      config.volumeLookback,
    );
    const status = getOrderBlockStatus(
      candles,
      displacementEnd,
      direction,
      source.low,
      source.high,
    );

    zones.push({
      direction,
      lower: source.low,
      upper: source.high,
      status,
      displacementAtrRatio: displacement.bodyAtrRatio,
      volumeRatio,
      volumeExpanded: volumeRatio >= config.preferredVolumeRatio,
      breakOfStructure: true,
      qualified:
        displacement.bodyAtrRatio >= config.minimumDisplacementAtrRatio &&
        status !== 'fully mitigated' &&
        status !== 'invalidated',
      formedAt: candles[bosIndex].timestamp,
      formedAtIndex: candles[bosIndex].index,
      sourceCandleIndex: source.index,
      displacementCandleIndex: displacement.candleIndex,
      bosCandleIndex: candles[bosIndex].index,
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

function findDisplacementEnd(
  candles: readonly MarketCandle[],
  sourceIndex: number,
  direction: OrderBlockDirection,
  config: Readonly<OrderBlockRuleConfig>,
): number | null {
  let end = sourceIndex;

  for (
    let index = sourceIndex + 1;
    index < candles.length && index <= sourceIndex + config.maximumDisplacementCandles;
    index += 1
  ) {
    if (!hasDirection(candles[index], direction)) {
      break;
    }
    end = index;
  }

  return end > sourceIndex ? end : null;
}

function findQualifyingDisplacement(
  candles: readonly MarketCandle[],
  sourceIndex: number,
  displacementEnd: number,
  direction: OrderBlockDirection,
  config: Readonly<OrderBlockRuleConfig>,
): { bodyAtrRatio: number; maximumVolume: number; candleIndex: number } | null {
  let best: { bodyAtrRatio: number; maximumVolume: number; candleIndex: number } | null = null;
  let maximumVolume = 0;

  for (let index = sourceIndex + 1; index <= displacementEnd; index += 1) {
    const candle = candles[index];
    maximumVolume = Math.max(maximumVolume, candle.volume);
    const bodyAtrRatio =
      Math.abs(candle.close - candle.open) /
      calculateAtr(candles, index, config.atrPeriod);

    if (!best || bodyAtrRatio > best.bodyAtrRatio) {
      best = { bodyAtrRatio, maximumVolume, candleIndex: candle.index };
    }
  }

  return best && best.bodyAtrRatio >= config.minimumDisplacementAtrRatio
    ? { ...best, maximumVolume }
    : null;
}

function findBreakOfStructure(
  candles: readonly MarketCandle[],
  startIndex: number,
  endIndex: number,
  direction: OrderBlockDirection,
  lookback: number,
): number | null {
  for (let index = startIndex; index <= endIndex; index += 1) {
    const priorCandles = candles.slice(Math.max(0, index - lookback), index);
    if (priorCandles.length === 0) {
      continue;
    }

    const brokeStructure =
      direction === 'bullish'
        ? candles[index].close > Math.max(...priorCandles.map((candle) => candle.high))
        : candles[index].close < Math.min(...priorCandles.map((candle) => candle.low));
    if (brokeStructure) {
      return index;
    }
  }

  return null;
}

function getOrderBlockStatus(
  candles: readonly MarketCandle[],
  confirmedIndex: number,
  direction: OrderBlockDirection,
  lower: number,
  upper: number,
): OrderBlockStatus {
  let touched = false;
  let partiallyMitigated = false;

  for (let index = confirmedIndex + 1; index < candles.length; index += 1) {
    const candle = candles[index];

    if (direction === 'bullish') {
      if (candle.close < lower) {
        return 'invalidated';
      }
      if (candle.low <= lower) {
        return 'fully mitigated';
      }
      if (candle.low < upper) {
        partiallyMitigated = true;
      } else if (candle.low === upper) {
        touched = true;
      }
    } else {
      if (candle.close > upper) {
        return 'invalidated';
      }
      if (candle.high >= upper) {
        return 'fully mitigated';
      }
      if (candle.high > lower) {
        partiallyMitigated = true;
      } else if (candle.high === lower) {
        touched = true;
      }
    }
  }

  if (partiallyMitigated) {
    return 'partially mitigated';
  }
  return touched ? 'touched' : 'fresh';
}

function hasDirection(candle: MarketCandle, direction: OrderBlockDirection): boolean {
  return direction === 'bullish'
    ? candle.close > candle.open
    : candle.close < candle.open;
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

function latestZone(
  zones: readonly OrderBlockZone[],
  direction: OrderBlockDirection,
  qualifiedOnly = false,
): OrderBlockZone | null {
  return zones
    .filter((zone) => zone.direction === direction && (!qualifiedOnly || zone.qualified))
    .at(-1) ?? null;
}
