import {
  analyzeFairValueGaps,
  calculateAtr,
  MarketCandle,
} from './fvg-rule';
import { analyzeOrderBlocks } from './order-block-rule';
import {
  TRADING_RULE_DEFINITIONS,
  TRADING_RULE_CONFIG,
  TradingRuleId,
} from './rule-registry';

export type RuleStatus = 'pass' | 'fail' | 'unavailable' | 'not-applicable';
export type TradeDirection = 'bullish' | 'bearish';

export interface DailyMarketCandle extends MarketCandle {
  tradedValue?: number;
  vwap?: number;
  completed?: boolean;
}

export interface ActivePosition {
  direction: TradeDirection;
  entry: number;
  stopLoss: number;
  quantity: number;
  highestClose?: number;
  lowestClose?: number;
}

export interface TradingRuleInputs {
  dailyCandles?: readonly DailyMarketCandle[];
  sessionCandles?: readonly MarketCandle[];
  timeSlotVolumeSamples?: readonly number[];
  higherTimeframeCandles?: readonly MarketCandle[];
  benchmarkCandles?: readonly MarketCandle[];
  benchmarkSessionCandles?: readonly MarketCandle[];
  benchmarkVwap?: number;
  benchmarkEma20Rising?: boolean;
  marketBreadthPercent?: number;
  bid?: number;
  ask?: number;
  marketCapRupees?: number;
  sharesOutstanding?: number;
  marketCapCategory?: 'large' | 'mid' | 'small' | 'unclassified';
  orderBookDepthAvailable?: boolean;
  previousDay?: { high: number; low: number; close: number };
  capital?: number;
  availableCapital?: number;
  dailyPnl?: number;
  openPositionCount?: number;
  entry?: number;
  stopLoss?: number;
  target?: number;
  expectedCostsPerShare?: number;
  lotSize?: number;
  maximumParticipationQuantity?: number;
  activePosition?: ActivePosition;
}

export interface TradingRuleResult {
  id: TradingRuleId;
  status: RuleStatus;
  reason: string;
  value?: number | string;
  metrics?: Record<string, number | string>;
  blocksCandidate?: boolean;
}

export interface TradingRuleAnalysis {
  direction: TradeDirection;
  results: Record<TradingRuleId, TradingRuleResult>;
  score: number;
  classification: 'high-quality' | 'watchlist' | 'low-priority' | 'reject';
}

interface SwingPoint {
  index: number;
  price: number;
  kind: 'high' | 'low';
}

interface PriceLevels {
  support: number[];
  resistance: number[];
}

const RULE_IDS: readonly TradingRuleId[] = [
  'R001', 'R002', 'R003', 'R004', 'R005', 'R005B', 'R006', 'R007',
  'R008', 'R009', 'R010', 'R011', 'R012', 'R013', 'R014', 'R015',
  'R016', 'R017', 'R018', 'R019', 'R020', 'R021', 'R022', 'R023',
];

export function evaluateTradingRules(
  candles: readonly MarketCandle[],
  direction: TradeDirection,
  inputs: TradingRuleInputs = {},
  enabledRules?: Readonly<Record<TradingRuleId, boolean>>,
): TradingRuleAnalysis {
  const results = Object.fromEntries(
    RULE_IDS.map((id) => [id, unavailable(id, 'Required input is not available.')]),
  ) as Record<TradingRuleId, TradingRuleResult>;
  const current = candles.at(-1);
  const closeValues = candles.map((candle) => candle.close);

  if (!current || candles.length < 2 || !candles.every(isValidCandle)) {
    for (const id of RULE_IDS) {
      results[id] = unavailable(id, 'Valid OHLCV candle history is required.');
    }
    return { direction, results, score: 0, classification: 'reject' };
  }

  evaluateLiquidityRule(results, inputs);
  evaluateSpreadRule(results, inputs);
  evaluateMarketCapRule(results, inputs, current.close);
  evaluateVwapRule(results, direction, inputs.sessionCandles);
  evaluateEmaRule(results, direction, closeValues);
  evaluateHigherTrendRule(results, direction, inputs.higherTimeframeCandles);
  evaluateRelativeVolumeRule(results, current, inputs.timeSlotVolumeSamples);
  evaluateRsiRule(results, direction, closeValues);
  evaluateMacdRule(results, direction, closeValues);
  evaluateOpeningRangeRule(results, direction, candles, inputs);
  evaluateBosRule(results, direction, candles);
  evaluateFvgRule(results, direction, candles);
  evaluateOrderBlockRule(results, direction, candles);
  evaluateSupportResistanceRule(results, direction, current.close, candles, inputs);
  evaluateAtrRule(results, candles);
  evaluateRewardRiskRule(results, direction, inputs, candles);
  evaluateDailyLossRule(results, inputs);
  evaluatePositionCountRule(results, inputs);
  evaluateMarketRegimeRule(results, direction, inputs);
  evaluateRelativeStrengthRule(results, direction, candles, inputs.benchmarkCandles);
  evaluateChochRule(results, direction, candles);
  evaluatePositionSizingRule(results, direction, inputs, candles);
  evaluateProfitBookingRule(results, inputs.activePosition, current.close, candles);
  evaluateTrailingStopRule(results, inputs.activePosition, current.close, candles);

  const score = calculateScore(results, enabledRules);
  return {
    direction,
    results,
    score,
    classification:
      score >= 80 ? 'high-quality' :
        score >= 70 ? 'watchlist' :
          score >= 60 ? 'low-priority' : 'reject',
  };
}

export function passesMandatoryRules(
  analysis: TradingRuleAnalysis,
  enabledRules: Readonly<Record<TradingRuleId, boolean>>,
): boolean {
  return TRADING_RULE_DEFINITIONS
    .filter((rule) =>
      enabledRules[rule.id] &&
      (rule.blocking || analysis.results[rule.id].blocksCandidate === true),
    )
    .every((rule) => analysis.results[rule.id].status === 'pass');
}

function evaluateLiquidityRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  inputs: TradingRuleInputs,
): void {
  const completed = inputs.dailyCandles?.filter((candle) => candle.completed === true) ?? [];
  if (completed.length < TRADING_RULE_CONFIG.adtvLookbackSessions) {
    results.R001 = unavailable(
      'R001',
      `Need ${TRADING_RULE_CONFIG.adtvLookbackSessions} completed daily sessions; received ${completed.length}.`,
    );
    return;
  }

  const recent = completed.slice(-TRADING_RULE_CONFIG.adtvLookbackSessions);
  if (!recent.every((candle) =>
    isValidCandle(candle) &&
    (candle.tradedValue === undefined || Number.isFinite(candle.tradedValue)) &&
    (candle.tradedValue === undefined || isPositive(candle.tradedValue)) &&
    (candle.vwap === undefined || isPositive(candle.vwap)),
  )) {
    results.R001 = unavailable('R001', 'Completed daily candles contain invalid price, volume or traded-value data.');
    return;
  }
  const usesPriceProxy = recent.some((candle) => candle.tradedValue === undefined);
  const adtv = recent.reduce(
    (total, candle) =>
      total + (candle.tradedValue ?? (candle.vwap ?? candle.close) * candle.volume),
    0,
  ) / recent.length;
  results.R001 = result(
    'R001',
    adtv >= TRADING_RULE_CONFIG.minimumAdtvRupees ? 'pass' : 'fail',
    `20-session ADTV ${formatRupees(adtv)}${usesPriceProxy ? ' (price × volume proxy)' : ' (exchange traded value)'}; minimum ${formatRupees(TRADING_RULE_CONFIG.minimumAdtvRupees)}.`,
    adtv,
  );
}

function evaluateSpreadRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  inputs: TradingRuleInputs,
): void {
  if (!isPositive(inputs.bid) || !isPositive(inputs.ask) || inputs.ask < inputs.bid) {
    results.R002 = unavailable('R002', 'A valid live bid and ask quote is required.');
    return;
  }

  const midpoint = (inputs.ask + inputs.bid) / 2;
  const spreadPercent = ((inputs.ask - inputs.bid) / midpoint) * 100;
  results.R002 = result(
    'R002',
    spreadPercent <= TRADING_RULE_CONFIG.maximumSpreadPercent ? 'pass' : 'fail',
    `Quoted spread ${spreadPercent.toFixed(3)}%; maximum ${TRADING_RULE_CONFIG.maximumSpreadPercent}%.`,
    spreadPercent,
  );
}

function evaluateMarketCapRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  inputs: TradingRuleInputs,
  currentPrice: number,
): void {
  const marketCap = inputs.marketCapRupees ??
    (isPositive(inputs.sharesOutstanding) ? currentPrice * inputs.sharesOutstanding : undefined);
  const category = inputs.marketCapCategory;
  if (!category) {
    results.R003 = unavailable(
      'R003',
      marketCap === undefined
        ? 'AMFI category, market capitalization or outstanding-share data is required.'
        : `Market cap ${formatRupees(marketCap)} calculated; six-month AMFI category is required.`,
    );
    return;
  }

  if (category === 'unclassified') {
    results.R003 = result(
      'R003',
      'unavailable',
      marketCap === undefined
        ? 'Market capitalization is not mapped to an AMFI category.'
        : `Market cap ${formatRupees(marketCap)} is not mapped to an AMFI category.`,
      marketCap,
    );
    return;
  }
  if (category === 'small' && inputs.orderBookDepthAvailable !== true) {
    results.R003 = {
      ...unavailable('R003', 'Small-cap classification requires an order-book depth check.'),
      blocksCandidate: true,
    };
    return;
  }

  results.R003 = result(
    'R003',
    'pass',
    `AMFI category: ${category}${category === 'small' ? '; depth check supplied.' : '.'}`,
    category,
    marketCap === undefined ? undefined : { marketCapRupees: marketCap },
  );
}

function evaluateVwapRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  sessionCandles?: readonly MarketCandle[],
): void {
  if (
    !sessionCandles || sessionCandles.length < 2 ||
    !sessionCandles.every(isValidCandle)
  ) {
    results.R004 = unavailable('R004', 'Complete current-session candles are required for session VWAP and slope.');
    return;
  }

  let weightedPrice = 0;
  let totalVolume = 0;
  let previousVwap: number | null = null;
  for (const candle of sessionCandles) {
    if (candle.volume <= 0) {
      continue;
    }
    previousVwap = totalVolume > 0 ? weightedPrice / totalVolume : null;
    weightedPrice += ((candle.high + candle.low + candle.close) / 3) * candle.volume;
    totalVolume += candle.volume;
  }

  if (totalVolume === 0 || previousVwap === null) {
    results.R004 = unavailable('R004', 'Session VWAP requires at least two positive-volume candles.');
    return;
  }

  const vwap = weightedPrice / totalVolume;
  const latest = sessionCandles.at(-1)!;
  const aligned = direction === 'bullish'
    ? latest.close > vwap && vwap > previousVwap
    : latest.close < vwap && vwap < previousVwap;
  results.R004 = result(
    'R004',
    aligned ? 'pass' : 'fail',
    `${direction === 'bullish' ? 'Bullish' : 'Bearish'} VWAP condition ${aligned ? 'confirmed' : 'not met'}; VWAP ${vwap.toFixed(2)}.`,
    vwap,
  );
}

function evaluateEmaRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  closes: readonly number[],
): void {
  const fast = emaSeries(closes, TRADING_RULE_CONFIG.emaFastPeriod).at(-1);
  const slow = emaSeries(closes, TRADING_RULE_CONFIG.emaSlowPeriod).at(-1);
  if (fast === null || fast === undefined || slow === null || slow === undefined) {
    results.R005 = unavailable('R005', 'At least 20 primary-timeframe closes are required.');
    return;
  }

  const aligned = direction === 'bullish' ? fast > slow : fast < slow;
  const separation = ((fast - slow) / slow) * 100;
  results.R005 = result(
    'R005',
    aligned ? 'pass' : 'fail',
    `EMA9 ${fast.toFixed(2)}, EMA20 ${slow.toFixed(2)}, separation ${separation.toFixed(2)}%.`,
    separation,
  );
}

function evaluateHigherTrendRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  candles?: readonly MarketCandle[],
): void {
  if (!candles || candles.length < TRADING_RULE_CONFIG.higherTrendSlowPeriod) {
    results.R005B = unavailable(
      'R005B',
      `Need ${TRADING_RULE_CONFIG.higherTrendSlowPeriod} higher-timeframe candles; suitable history is not supplied.`,
    );
    return;
  }

  const closes = candles.map((candle) => candle.close);
  const fast = emaSeries(closes, TRADING_RULE_CONFIG.higherTrendFastPeriod).at(-1);
  const slow = emaSeries(closes, TRADING_RULE_CONFIG.higherTrendSlowPeriod).at(-1);
  const latest = closes.at(-1)!;
  if (fast === null || fast === undefined || slow === null || slow === undefined) {
    results.R005B = unavailable('R005B', 'Higher-timeframe EMA history is insufficient.');
    return;
  }
  const aligned = direction === 'bullish'
    ? latest > fast && fast > slow
    : latest < fast && fast < slow;
  results.R005B = result(
    'R005B',
    aligned ? 'pass' : 'fail',
    `Close ${latest.toFixed(2)}, EMA50 ${fast.toFixed(2)}, EMA200 ${slow.toFixed(2)}.`,
    fast - slow,
  );
}

function evaluateRelativeVolumeRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  current: MarketCandle,
  samples?: readonly number[],
): void {
  if (!samples || samples.length < TRADING_RULE_CONFIG.relativeVolumeLookbackSessions) {
    results.R006 = unavailable(
      'R006',
      `Need ${TRADING_RULE_CONFIG.relativeVolumeLookbackSessions} same-time-slot volume samples.`,
    );
    return;
  }

  const baseline = average(samples.slice(-TRADING_RULE_CONFIG.relativeVolumeLookbackSessions));
  if (baseline <= 0) {
    results.R006 = unavailable('R006', 'Time-slot baseline volume must be positive.');
    return;
  }
  const relativeVolume = current.volume / baseline;
  results.R006 = result(
    'R006',
    relativeVolume >= TRADING_RULE_CONFIG.minimumRelativeVolume ? 'pass' : 'fail',
    `RVOL ${relativeVolume.toFixed(2)}×; minimum ${TRADING_RULE_CONFIG.minimumRelativeVolume}×.`,
    relativeVolume,
  );
}

function evaluateRsiRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  closes: readonly number[],
): void {
  const rsi = calculateRsi(closes, TRADING_RULE_CONFIG.rsiPeriod);
  if (rsi === null) {
    results.R007 = unavailable('R007', `Need at least ${TRADING_RULE_CONFIG.rsiPeriod + 1} closes.`);
    return;
  }
  const aligned = direction === 'bullish'
    ? rsi >= TRADING_RULE_CONFIG.bullishRsiMinimum && rsi <= TRADING_RULE_CONFIG.bullishRsiMaximum
    : rsi >= TRADING_RULE_CONFIG.bearishRsiMinimum && rsi <= TRADING_RULE_CONFIG.bearishRsiMaximum;
  results.R007 = result(
    'R007',
    aligned ? 'pass' : 'fail',
    `RSI(14) ${rsi.toFixed(1)}; ${direction} range is ${
      direction === 'bullish'
        ? `${TRADING_RULE_CONFIG.bullishRsiMinimum}–${TRADING_RULE_CONFIG.bullishRsiMaximum}`
        : `${TRADING_RULE_CONFIG.bearishRsiMinimum}–${TRADING_RULE_CONFIG.bearishRsiMaximum}`
    }.`,
    rsi,
  );
}

function evaluateMacdRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  closes: readonly number[],
): void {
  const fast = emaSeries(closes, TRADING_RULE_CONFIG.macdFastPeriod);
  const slow = emaSeries(closes, TRADING_RULE_CONFIG.macdSlowPeriod);
  const macd = fast.map((value, index) =>
    value === null || slow[index] === null ? null : value - slow[index]!,
  );
  const validMacd = macd.filter((value): value is number => value !== null);
  const signalSeries = emaSeries(validMacd, TRADING_RULE_CONFIG.macdSignalPeriod);
  const currentMacd = validMacd.at(-1);
  const previousMacd = validMacd.at(-2);
  const signal = signalSeries.at(-1);
  const previousSignal = signalSeries.at(-2);
  if (
    currentMacd === undefined || previousMacd === undefined ||
    signal === null || signal === undefined ||
    previousSignal === null || previousSignal === undefined
  ) {
    results.R008 = unavailable('R008', 'At least 35 closes are required for MACD(12, 26, 9).');
    return;
  }
  const histogram = currentMacd - signal;
  const previousHistogram = previousMacd - previousSignal;
  const aligned = direction === 'bullish'
    ? currentMacd > signal && histogram > 0
    : currentMacd < signal && histogram < 0;
  results.R008 = result(
    'R008',
    aligned ? 'pass' : 'fail',
    `MACD ${currentMacd.toFixed(4)}, signal ${signal.toFixed(4)}, histogram ${histogram.toFixed(4)}; ${
      direction === 'bullish' ? 'accelerating' : 'decelerating'
    }=${direction === 'bullish' ? histogram > previousHistogram : histogram < previousHistogram}.`,
    histogram,
  );
}

function evaluateOpeningRangeRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  candles: readonly MarketCandle[],
  inputs: TradingRuleInputs,
): void {
  const session = inputs.sessionCandles;
  if (!session || session.length < 4) {
    results.R009 = unavailable('R009', 'Current-session 5-minute candles, including the opening range, are required.');
    return;
  }
  const openingTimes = ['09:15', '09:20', '09:25'];
  const opening = session.slice(0, 3);
  if (opening.some((candle, index) => !candle.time.includes(openingTimes[index]))) {
    results.R009 = unavailable('R009', 'Opening-range candles must be the 09:15, 09:20 and 09:25 NSE bars.');
    return;
  }

  const high = Math.max(...opening.map((candle) => candle.high));
  const low = Math.min(...opening.map((candle) => candle.low));
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const latest = session.at(-1)!;
  const breakoutLevel = direction === 'bullish'
    ? high + TRADING_RULE_CONFIG.minimumBreakoutAtr * atr
    : low - TRADING_RULE_CONFIG.minimumBreakoutAtr * atr;
  const afterOpening = session.slice(3);
  const breakoutIndex = afterOpening.findIndex((candle) =>
    direction === 'bullish'
      ? candle.close > breakoutLevel
      : candle.close < breakoutLevel,
  );
  const retestCandle = afterOpening.at(-1);
  const retestConfirmed = breakoutIndex >= 0 &&
    !!retestCandle &&
    afterOpening.length - 1 > breakoutIndex &&
    (direction === 'bullish'
      ? retestCandle.low <= high + 0.05 * atr && retestCandle.close > high
      : retestCandle.high >= low - 0.05 * atr && retestCandle.close < low);
  const volumeSamples = inputs.timeSlotVolumeSamples;
  const relativeVolume = volumeSamples &&
    volumeSamples.length >= TRADING_RULE_CONFIG.relativeVolumeLookbackSessions
    ? latest.volume / average(volumeSamples.slice(-TRADING_RULE_CONFIG.relativeVolumeLookbackSessions))
    : null;
  const sessionCloses = session.map((candle) => candle.close);
  const fast = emaSeries(sessionCloses, TRADING_RULE_CONFIG.emaFastPeriod).at(-1);
  const slow = emaSeries(sessionCloses, TRADING_RULE_CONFIG.emaSlowPeriod).at(-1);
  const vwap = calculateSessionVwap(session);
  if (
    relativeVolume === null || fast === null || fast === undefined ||
    slow === null || slow === undefined || vwap === null
  ) {
    results.R009 = unavailable(
      'R009',
      'ORB needs same-slot volume history, session VWAP and sufficient EMA history.',
    );
    return;
  }
  const confirmations = direction === 'bullish'
    ? latest.close > vwap && fast > slow
    : latest.close < vwap && fast < slow;
  const qualified = retestConfirmed &&
    relativeVolume >= TRADING_RULE_CONFIG.minimumRelativeVolume &&
    confirmations;
  results.R009 = result(
    'R009',
    qualified ? 'pass' : 'fail',
    `ORH ${high.toFixed(2)}, ORL ${low.toFixed(2)}, RVOL ${relativeVolume.toFixed(2)}×; conservative breakout retest, VWAP and EMA confirmation ${
      qualified ? 'passed' : 'not all met'
    }.`,
    direction === 'bullish' ? high : low,
  );
}

function evaluateBosRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  candles: readonly MarketCandle[],
): void {
  const swings = findSwings(candles);
  const latestSwing = [...swings].reverse().find((swing) =>
    swing.kind === (direction === 'bullish' ? 'high' : 'low'),
  );
  const latest = candles.at(-1)!;
  if (!latestSwing || latestSwing.index >= candles.length - 1) {
    results.R010 = unavailable('R010', 'A confirmed 2-left / 2-right structural swing is required.');
    return;
  }
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const buffer = Math.max(0.01, TRADING_RULE_CONFIG.minimumBreakoutAtr * atr);
  const bodyAtr = Math.abs(latest.close - latest.open) / atr;
  const broken = direction === 'bullish'
    ? latest.close > latestSwing.price + buffer
    : latest.close < latestSwing.price - buffer;
  const qualified = broken && bodyAtr >= TRADING_RULE_CONFIG.minimumBosBodyAtr;
  results.R010 = result(
    'R010',
    qualified ? 'pass' : 'fail',
    `${direction} swing break ${broken ? 'detected' : 'not detected'}; body ${bodyAtr.toFixed(2)} ATR (minimum ${TRADING_RULE_CONFIG.minimumBosBodyAtr}).`,
    bodyAtr,
  );
}

function evaluateFvgRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  candles: readonly MarketCandle[],
): void {
  const analysis = analyzeFairValueGaps(candles);
  const zone = direction === 'bullish'
    ? analysis.latestQualifiedBullish
    : analysis.latestQualifiedBearish;
  results.R011 = zone
    ? result(
      'R011',
      'pass',
      `${direction} FVG ${zone.status}; gap ${zone.gapAtrRatio.toFixed(2)} ATR, middle body ${zone.middleBodyAtrRatio.toFixed(2)} ATR, volume ${zone.volumeRatio.toFixed(2)}×.`,
      zone.gapAtrRatio,
    )
    : result('R011', 'fail', `No qualified, unmitigated ${direction} FVG was found.`);
}

function evaluateOrderBlockRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  candles: readonly MarketCandle[],
): void {
  const analysis = analyzeOrderBlocks(candles);
  const zone = direction === 'bullish'
    ? analysis.latestQualifiedBullish
    : analysis.latestQualifiedBearish;
  results.R012 = zone
    ? result(
      'R012',
      'pass',
      `${direction} algorithmic price-action zone is ${zone.status}; displacement ${zone.displacementAtrRatio.toFixed(2)} ATR, BOS confirmed.`,
      zone.displacementAtrRatio,
    )
    : result('R012', 'fail', `No qualified, active ${direction} order-block zone was found.`);
}

function evaluateSupportResistanceRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  price: number,
  candles: readonly MarketCandle[],
  inputs: TradingRuleInputs,
): void {
  const levels = getPriceLevels(candles, inputs.previousDay);
  const support = levels.support.filter((level) => level < price).sort((a, b) => b - a)[0];
  const resistance = levels.resistance.filter((level) => level > price).sort((a, b) => a - b)[0];
  if (support === undefined && resistance === undefined) {
    results.R013 = unavailable('R013', 'Previous-day values or confirmed swing levels are required.');
    return;
  }
  const relevant = direction === 'bullish' ? resistance : support;
  const availableMove = relevant === undefined
    ? null
    : Math.abs(relevant - price) / price * 100;
  const levelsText = `support ${support?.toFixed(2) ?? 'unavailable'}, resistance ${resistance?.toFixed(2) ?? 'unavailable'}`;
  results.R013 = result(
    'R013',
    'pass',
    `${levelsText}; nearest ${direction === 'bullish' ? 'resistance' : 'support'} is ${
      availableMove === null ? 'unavailable' : `${availableMove.toFixed(2)}% away`
    }.`,
    relevant ?? support ?? resistance!,
    {
      ...(support === undefined ? {} : { support }),
      ...(resistance === undefined ? {} : { resistance }),
      ...(availableMove === null ? {} : { availableMovePercent: availableMove }),
    },
  );
}

function evaluateAtrRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  candles: readonly MarketCandle[],
): void {
  if (candles.length <= TRADING_RULE_CONFIG.atrPeriod) {
    results.R014 = unavailable('R014', `Need at least ${TRADING_RULE_CONFIG.atrPeriod + 1} candles.`);
    return;
  }
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const close = candles.at(-1)!.close;
  results.R014 = result(
    'R014',
    atr > 0 ? 'pass' : 'fail',
    `Wilder ATR(14) ${atr.toFixed(2)} (${(atr / close * 100).toFixed(2)}% of close).`,
    atr,
  );
}

function evaluateRewardRiskRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  inputs: TradingRuleInputs,
  candles: readonly MarketCandle[],
): void {
  if (!isPositive(inputs.entry) || !isPositive(inputs.target)) {
    results.R015 = unavailable('R015', 'A strategy-supplied entry and executable target are required.');
    return;
  }
  const stopLoss = isPositive(inputs.stopLoss)
    ? inputs.stopLoss
    : deriveCombinedStopLoss(candles, direction, inputs.entry);
  if (stopLoss === null || stopLoss === undefined) {
    results.R015 = unavailable('R015', 'A confirmed swing and ATR are required to derive the protective stop.');
    return;
  }
  if (
    (inputs.stopLoss !== undefined && !isPositive(inputs.stopLoss)) ||
    (inputs.expectedCostsPerShare !== undefined &&
      (!Number.isFinite(inputs.expectedCostsPerShare) || inputs.expectedCostsPerShare < 0))
  ) {
    results.R015 = unavailable('R015', 'Stop loss and expected transaction costs must be valid non-negative inputs.');
    return;
  }
  const risk = direction === 'bullish'
    ? inputs.entry - stopLoss
    : stopLoss - inputs.entry;
  const reward = direction === 'bullish'
    ? inputs.target - inputs.entry
    : inputs.entry - inputs.target;
  if (risk <= 0 || reward <= 0) {
    results.R015 = result('R015', 'fail', 'Entry, stop and target are not ordered correctly for this direction.');
    return;
  }
  const costs = inputs.expectedCostsPerShare ?? 0;
  const ratio = Math.max(0, reward - costs) / (risk + costs);
  results.R015 = result(
    'R015',
    ratio >= TRADING_RULE_CONFIG.minimumRewardRisk ? 'pass' : 'fail',
    `Net reward/risk ${ratio.toFixed(2)}:1; minimum ${TRADING_RULE_CONFIG.minimumRewardRisk}:1.`,
    ratio,
    {
      entry: inputs.entry,
      stopLoss,
      target: inputs.target,
      risk,
      netReward: Math.max(0, reward - costs),
    },
  );
}

function evaluateDailyLossRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  inputs: TradingRuleInputs,
): void {
  if (!isPositive(inputs.capital) || typeof inputs.dailyPnl !== 'number' || !Number.isFinite(inputs.dailyPnl)) {
    results.R016 = unavailable('R016', 'Account capital and realized/unrealized daily P&L after costs are required.');
    return;
  }
  const lossLimit = inputs.capital * TRADING_RULE_CONFIG.dailyLossPercent / 100;
  const withinLimit = inputs.dailyPnl > -lossLimit;
  results.R016 = result(
    'R016',
    withinLimit ? 'pass' : 'fail',
    `Daily P&L ${formatRupees(inputs.dailyPnl)}; loss limit ${formatRupees(lossLimit)}.`,
    inputs.dailyPnl,
  );
}

function evaluatePositionCountRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  inputs: TradingRuleInputs,
): void {
  if (typeof inputs.openPositionCount !== 'number' || !Number.isInteger(inputs.openPositionCount)) {
    results.R017 = unavailable('R017', 'Live open-position count is required.');
    return;
  }
  const allowed = inputs.openPositionCount < TRADING_RULE_CONFIG.maximumOpenPositions;
  results.R017 = result(
    'R017',
    allowed ? 'pass' : 'fail',
    `${inputs.openPositionCount} positions open; maximum ${TRADING_RULE_CONFIG.maximumOpenPositions}.`,
    inputs.openPositionCount,
  );
}

function evaluateMarketRegimeRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  inputs: TradingRuleInputs,
): void {
  const benchmark = inputs.benchmarkSessionCandles;
  if (
    !benchmark || benchmark.length < 2 ||
    !benchmark.every(isValidCandle) ||
    !isPositive(inputs.benchmarkVwap) ||
    typeof inputs.benchmarkEma20Rising !== 'boolean' ||
    typeof inputs.marketBreadthPercent !== 'number' ||
    !Number.isFinite(inputs.marketBreadthPercent) ||
    inputs.marketBreadthPercent < 0 ||
    inputs.marketBreadthPercent > 100
  ) {
    results.R018 = unavailable('R018', 'NIFTY session candles/VWAP, EMA20 slope and current market breadth are required.');
    return;
  }
  const last = benchmark.at(-1)!;
  const breadth = inputs.marketBreadthPercent;
  const bullish = last.close > inputs.benchmarkVwap &&
    inputs.benchmarkEma20Rising &&
    breadth > 50;
  const bearish = last.close < inputs.benchmarkVwap &&
    (!inputs.benchmarkEma20Rising || breadth < 40);
  const aligned = direction === 'bullish' ? bullish : bearish;
  results.R018 = result(
    'R018',
    aligned ? 'pass' : 'fail',
    `NIFTY ${last.close > inputs.benchmarkVwap ? 'above' : 'below'} VWAP; EMA20 ${
      inputs.benchmarkEma20Rising ? 'rising' : 'falling'
    }; breadth ${breadth.toFixed(1)}%.`,
    breadth,
  );
}

function evaluateRelativeStrengthRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  stockCandles: readonly MarketCandle[],
  benchmarkCandles?: readonly MarketCandle[],
): void {
  if (
    !benchmarkCandles ||
    benchmarkCandles.length !== stockCandles.length ||
    !benchmarkCandles.every(isValidCandle)
  ) {
    results.R019 = unavailable('R019', 'Time-aligned stock and NIFTY candles are required for 15/30/60-minute comparison.');
    return;
  }
  const periods = TRADING_RULE_CONFIG.relativeStrengthPeriodsMinutes.map((minutes) =>
    Math.max(1, Math.round(minutes / 5)),
  );
  const performance: number[] = [];
  for (const bars of periods) {
    const stockNow = stockCandles.at(-1)!;
    const stockThen = stockCandles.at(-1 - bars);
    const indexNow = benchmarkCandles.at(-1)!;
    const indexThen = benchmarkCandles.at(-1 - bars);
    if (!stockThen || !indexThen || Math.abs(stockNow.timestamp - indexNow.timestamp) > 60_000) {
      results.R019 = unavailable('R019', 'Benchmark history is not sufficiently long or time-aligned.');
      return;
    }
    const stockReturn = (stockNow.close - stockThen.close) / stockThen.close;
    const indexReturn = (indexNow.close - indexThen.close) / indexThen.close;
    performance.push((stockReturn - indexReturn) * 100);
  }
  const averageRelativePerformance = average(performance);
  const aligned = direction === 'bullish'
    ? averageRelativePerformance > 0
    : averageRelativePerformance < 0;
  results.R019 = result(
    'R019',
    aligned ? 'pass' : 'fail',
    `Mean 15/30/60-minute relative performance ${averageRelativePerformance.toFixed(2)} percentage points.`,
    averageRelativePerformance,
  );
}

function evaluateChochRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  candles: readonly MarketCandle[],
): void {
  const swings = findSwings(candles);
  const highs = swings.filter((swing) => swing.kind === 'high');
  const lows = swings.filter((swing) => swing.kind === 'low');
  if (highs.length < 2 || lows.length < 2) {
    results.R020 = unavailable('R020', 'Two confirmed swing highs and lows are required to establish prior structure.');
    return;
  }
  const [previousHigh, latestHigh] = highs.slice(-2);
  const [previousLow, latestLow] = lows.slice(-2);
  const priorBearish = latestHigh.price < previousHigh.price && latestLow.price < previousLow.price;
  const priorBullish = latestHigh.price > previousHigh.price && latestLow.price > previousLow.price;
  const close = candles.at(-1)!.close;
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const buffer = Math.max(0.01, TRADING_RULE_CONFIG.minimumBreakoutAtr * atr);
  const detected = direction === 'bullish'
    ? priorBearish && close > latestHigh.price + buffer
    : priorBullish && close < latestLow.price - buffer;
  results.R020 = result(
    'R020',
    detected ? 'pass' : 'fail',
    `Prior structure ${priorBullish ? 'higher highs / higher lows' : priorBearish ? 'lower highs / lower lows' : 'mixed'}; ${
      detected ? 'potential CHOCH detected' : 'no confirmed CHOCH'
    }.`,
    detected ? close : undefined,
  );
}

function evaluatePositionSizingRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  direction: TradeDirection,
  inputs: TradingRuleInputs,
  candles: readonly MarketCandle[],
): void {
  if (!isPositive(inputs.capital) || !isPositive(inputs.entry)) {
    results.R021 = unavailable('R021', 'Configured account capital and strategy entry are required.');
    return;
  }
  const stopLoss = isPositive(inputs.stopLoss)
    ? inputs.stopLoss
    : deriveCombinedStopLoss(candles, direction, inputs.entry);
  if (stopLoss === null || stopLoss === undefined) {
    results.R021 = unavailable('R021', 'A confirmed swing and ATR are required to derive the protective stop.');
    return;
  }
  const stopIsProtective = direction === 'bullish'
    ? stopLoss < inputs.entry
    : stopLoss > inputs.entry;
  if (!stopIsProtective) {
    results.R021 = result('R021', 'fail', 'The supplied stop loss is on the wrong side of the strategy entry.');
    return;
  }
  if (
    (inputs.stopLoss !== undefined && !isPositive(inputs.stopLoss)) ||
    (inputs.expectedCostsPerShare !== undefined &&
      (!Number.isFinite(inputs.expectedCostsPerShare) || inputs.expectedCostsPerShare < 0)) ||
    (inputs.availableCapital !== undefined &&
      (!Number.isFinite(inputs.availableCapital) || inputs.availableCapital < 0)) ||
    (inputs.maximumParticipationQuantity !== undefined &&
      (!Number.isFinite(inputs.maximumParticipationQuantity) || inputs.maximumParticipationQuantity < 0)) ||
    (inputs.lotSize !== undefined &&
      (!Number.isInteger(inputs.lotSize) || inputs.lotSize <= 0))
  ) {
    results.R021 = unavailable('R021', 'Available capital, costs, lot size and participation limits must be valid non-negative inputs.');
    return;
  }
  const perShareRisk = Math.abs(inputs.entry - stopLoss) +
    (inputs.expectedCostsPerShare ?? 0);
  if (perShareRisk <= 0) {
    results.R021 = result('R021', 'fail', 'Per-share risk must be greater than zero.');
    return;
  }
  const riskBudget = inputs.capital * TRADING_RULE_CONFIG.riskPerTradePercent / 100;
  let quantity = Math.floor(riskBudget / perShareRisk);
  if (inputs.availableCapital !== undefined) {
    quantity = Math.min(quantity, Math.floor(inputs.availableCapital / inputs.entry));
  }
  if (inputs.maximumParticipationQuantity !== undefined) {
    quantity = Math.min(quantity, Math.floor(inputs.maximumParticipationQuantity));
  }
  if (inputs.lotSize !== undefined) {
    quantity = Math.floor(quantity / inputs.lotSize) * inputs.lotSize;
  }
  const valid = quantity > 0;
  results.R021 = result(
    'R021',
    valid ? 'pass' : 'fail',
    `Risk budget ${formatRupees(riskBudget)}; stop ${stopLoss.toFixed(2)}; position size ${quantity} shares.`,
    quantity,
    {
      entry: inputs.entry,
      stopLoss,
      riskBudget,
      quantity,
      perShareRisk,
    },
  );
}

function deriveCombinedStopLoss(
  candles: readonly MarketCandle[],
  direction: TradeDirection,
  entry: number,
): number | null {
  if (candles.length <= TRADING_RULE_CONFIG.atrPeriod) {
    return null;
  }
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const swingKind = direction === 'bullish' ? 'low' : 'high';
  const swing = [...findSwings(candles)].reverse().find((point) => point.kind === swingKind);
  if (!swing) {
    return null;
  }
  const structuralStop = direction === 'bullish'
    ? swing.price - TRADING_RULE_CONFIG.stopBufferAtr * atr
    : swing.price + TRADING_RULE_CONFIG.stopBufferAtr * atr;
  const atrStop = direction === 'bullish'
    ? entry - TRADING_RULE_CONFIG.atrStopMultiple * atr
    : entry + TRADING_RULE_CONFIG.atrStopMultiple * atr;
  return direction === 'bullish'
    ? Math.min(structuralStop, atrStop)
    : Math.max(structuralStop, atrStop);
}

function evaluateProfitBookingRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  position: ActivePosition | undefined,
  currentPrice: number,
  candles: readonly MarketCandle[],
): void {
  if (!position || position.quantity <= 0) {
    results.R022 = unavailable('R022', 'An active position is required to evaluate partial profit booking.');
    return;
  }
  const risk = Math.abs(position.entry - position.stopLoss);
  if (
    risk <= 0 ||
    (position.direction === 'bullish' && position.stopLoss >= position.entry) ||
    (position.direction === 'bearish' && position.stopLoss <= position.entry)
  ) {
    results.R022 = result('R022', 'fail', 'Active position risk distance must be greater than zero.');
    return;
  }
  const multiples = TRADING_RULE_CONFIG.targetRiskMultiples;
  const targets = multiples.map((multiple) =>
    position.direction === 'bullish'
      ? position.entry + risk * multiple
      : position.entry - risk * multiple,
  );
  const reached = position.direction === 'bullish'
    ? targets.filter((target) => currentPrice >= target).length
    : targets.filter((target) => currentPrice <= target).length;
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const firstQuantity = Math.floor(
    position.quantity * TRADING_RULE_CONFIG.targetBookingPercents[0] / 100,
  );
  const secondQuantity = Math.floor(
    position.quantity * TRADING_RULE_CONFIG.targetBookingPercents[1] / 100,
  );
  const thirdQuantity = position.quantity - firstQuantity - secondQuantity;
  results.R022 = result(
    'R022',
    'pass',
    `Targets ${targets.map((target, index) =>
      `${multiples[index]}R ${target.toFixed(2)} (${TRADING_RULE_CONFIG.targetBookingPercents[index]}%)`,
    ).join(', ')}; ${reached} target(s) reached; ATR ${atr.toFixed(2)}.`,
    targets[reached] ?? targets[0],
    {
      target1: targets[0],
      target2: targets[1],
      target3: targets[2],
      quantity1: firstQuantity,
      quantity2: secondQuantity,
      quantity3: thirdQuantity,
    },
  );
}

function evaluateTrailingStopRule(
  results: Record<TradingRuleId, TradingRuleResult>,
  position: ActivePosition | undefined,
  currentPrice: number,
  candles: readonly MarketCandle[],
): void {
  if (!position || position.quantity <= 0) {
    results.R023 = unavailable('R023', 'An active position and its running price extreme are required.');
    return;
  }
  if (
    (position.direction === 'bullish' && position.stopLoss >= position.entry) ||
    (position.direction === 'bearish' && position.stopLoss <= position.entry)
  ) {
    results.R023 = result('R023', 'fail', 'Active position stop loss is invalid for its direction.');
    return;
  }
  const atr = calculateAtr(candles, candles.length - 1, TRADING_RULE_CONFIG.atrPeriod);
  const risk = Math.abs(position.entry - position.stopLoss);
  const firstTarget = position.direction === 'bullish'
    ? position.entry + risk * TRADING_RULE_CONFIG.targetRiskMultiples[0]
    : position.entry - risk * TRADING_RULE_CONFIG.targetRiskMultiples[0];
  const reachedFirstTarget = position.direction === 'bullish'
    ? currentPrice >= firstTarget
    : currentPrice <= firstTarget;
  if (!reachedFirstTarget) {
    results.R023 = result('R023', 'not-applicable', 'Trailing begins after the first profit target is reached.');
    return;
  }
  const extreme = position.direction === 'bullish'
    ? position.highestClose
    : position.lowestClose;
  if (!isPositive(extreme)) {
    results.R023 = unavailable('R023', 'Highest/lowest close since entry is required to calculate a non-widening trail.');
    return;
  }
  const proposed = position.direction === 'bullish'
    ? extreme - TRADING_RULE_CONFIG.trailingAtrMultiple * atr
    : extreme + TRADING_RULE_CONFIG.trailingAtrMultiple * atr;
  const trailingStop = position.direction === 'bullish'
    ? Math.max(position.stopLoss, proposed)
    : Math.min(position.stopLoss, proposed);
  results.R023 = result(
    'R023',
    'pass',
    `Proposed ${position.direction} trailing stop ${trailingStop.toFixed(2)}; it will not widen the existing stop.`,
    trailingStop,
  );
}

function getPriceLevels(
  candles: readonly MarketCandle[],
  previousDay?: TradingRuleInputs['previousDay'],
): PriceLevels {
  const support: number[] = [];
  const resistance: number[] = [];
  if (previousDay) {
    const pivot = (previousDay.high + previousDay.low + previousDay.close) / 3;
    const range = previousDay.high - previousDay.low;
    support.push(
      previousDay.low,
      2 * pivot - previousDay.high,
      pivot - range,
      previousDay.low - 2 * (previousDay.high - pivot),
    );
    resistance.push(
      previousDay.high,
      2 * pivot - previousDay.low,
      pivot + range,
      previousDay.high + 2 * (pivot - previousDay.low),
    );
  }
  for (const swing of findSwings(candles)) {
    if (swing.kind === 'low') {
      support.push(swing.price);
    } else {
      resistance.push(swing.price);
    }
  }
  return { support: uniqueLevels(support), resistance: uniqueLevels(resistance) };
}

function uniqueLevels(levels: readonly number[]): number[] {
  const sorted = [...levels].filter(isPositive).sort((left, right) => left - right);
  const clustered: number[] = [];
  for (const level of sorted) {
    const previous = clustered.at(-1);
    const withinCluster = previous !== undefined &&
      Math.abs(level - previous) / level * 100 <= TRADING_RULE_CONFIG.zoneClusterPercent;
    if (withinCluster) {
      clustered[clustered.length - 1] = (previous! + level) / 2;
    } else {
      clustered.push(level);
    }
  }
  return clustered;
}

function findSwings(candles: readonly MarketCandle[]): SwingPoint[] {
  const swings: SwingPoint[] = [];
  const left = TRADING_RULE_CONFIG.swingLeftBars;
  const right = TRADING_RULE_CONFIG.swingRightBars;
  for (let index = left; index < candles.length - right; index += 1) {
    const current = candles[index];
    const leftCandles = candles.slice(index - left, index);
    const rightCandles = candles.slice(index + 1, index + right + 1);
    if (
      leftCandles.every((candle) => current.high > candle.high) &&
      rightCandles.every((candle) => current.high > candle.high)
    ) {
      swings.push({ index, price: current.high, kind: 'high' });
    }
    if (
      leftCandles.every((candle) => current.low < candle.low) &&
      rightCandles.every((candle) => current.low < candle.low)
    ) {
      swings.push({ index, price: current.low, kind: 'low' });
    }
  }
  return swings.sort((leftSwing, rightSwing) => leftSwing.index - rightSwing.index);
}

function calculateSessionVwap(candles: readonly MarketCandle[]): number | null {
  let weightedPrice = 0;
  let totalVolume = 0;
  for (const candle of candles) {
    weightedPrice += ((candle.high + candle.low + candle.close) / 3) * candle.volume;
    totalVolume += candle.volume;
  }
  return totalVolume > 0 ? weightedPrice / totalVolume : null;
}

function emaSeries(values: readonly number[], period: number): Array<number | null> {
  const output: Array<number | null> = Array(values.length).fill(null);
  if (values.length < period) {
    return output;
  }
  let current = average(values.slice(0, period));
  output[period - 1] = current;
  const alpha = 2 / (period + 1);
  for (let index = period; index < values.length; index += 1) {
    current = alpha * values[index] + (1 - alpha) * current;
    output[index] = current;
  }
  return output;
}

function calculateRsi(values: readonly number[], period: number): number | null {
  if (values.length <= period) {
    return null;
  }
  let averageGain = 0;
  let averageLoss = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }
  averageGain /= period;
  averageLoss /= period;
  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
  }
  if (averageLoss === 0) {
    return averageGain === 0 ? 50 : 100;
  }
  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

function calculateScore(
  results: Record<TradingRuleId, TradingRuleResult>,
  enabledRules?: Readonly<Record<TradingRuleId, boolean>>,
): number {
  const scoreGroups: Array<{ ids: TradingRuleId[]; weight: number }> = [
    { ids: ['R019'], weight: 20 },
    { ids: ['R006'], weight: 20 },
    { ids: ['R004', 'R005'], weight: 20 },
    { ids: ['R010', 'R020'], weight: 15 },
    { ids: ['R007', 'R008'], weight: 10 },
    { ids: ['R013'], weight: 10 },
    { ids: ['R011', 'R012'], weight: 5 },
  ];
  const activeGroups = scoreGroups
    .map((group) => ({
      ...group,
      ids: group.ids.filter((id) => enabledRules?.[id] !== false),
    }))
    .filter((group) => group.ids.length > 0);
  const availableWeight = activeGroups.reduce((total, group) => total + group.weight, 0);
  if (availableWeight === 0) {
    return 0;
  }
  const earnedWeight = activeGroups.reduce((total, group) => {
    const earned = group.ids.reduce(
      (sum, id) => sum + (results[id].status === 'pass' ? 1 : 0),
      0,
    );
    return total + group.weight * earned / group.ids.length;
  }, 0);
  return Math.round(earnedWeight / availableWeight * 100);
}

function result(
  id: TradingRuleId,
  status: RuleStatus,
  reason: string,
  value?: number | string,
  metrics?: Record<string, number | string>,
): TradingRuleResult {
  return {
    id,
    status,
    reason,
    ...(value === undefined ? {} : { value }),
    ...(metrics === undefined ? {} : { metrics }),
  };
}

function unavailable(id: TradingRuleId, reason: string): TradingRuleResult {
  return result(id, 'unavailable', reason);
}

function isValidCandle(candle: MarketCandle): boolean {
  return [
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume,
    candle.timestamp,
    candle.index,
  ].every(Number.isFinite) &&
    candle.open > 0 &&
    candle.high > 0 &&
    candle.low > 0 &&
    candle.close > 0 &&
    candle.high >= Math.max(candle.open, candle.close) &&
    candle.low <= Math.min(candle.open, candle.close) &&
    candle.volume >= 0;
}

function isPositive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function average(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function formatRupees(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
